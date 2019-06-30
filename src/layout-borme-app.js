import { LitElement, html, css } from 'lit-element';
import {Layouts,Positioning,Alignment} from 'lit-flexbox-literals';         /// SOPORTE PARA FLEXBOX LAYOUTS
import {TopAppBar} from "@authentic/mwc-top-app-bar";
import {IconButton} from "@authentic/mwc-icon-button";
import {TextField} from "@authentic/mwc-textfield";
import {Card} from "@authentic/mwc-card";
import {Drawer} from "@authentic/mwc-drawer";
import {GoJsNodeAdapter
,NODE_TYPE_COMPANIES_SEARCH_RESULT
,NODE_TYPE_COMPANY
,NODE_TYPE_COMPANY_TITLE
,NODE_TYPE_PERSON
,NODE_TYPE_PERSON_SEARCH_RESULT
,NODE_TYPE_PERSON_TITLE} from './node-adapter';
import {GojsModelManager} from './gojs-manager';
import {CypherProcessor} from './cypher-processor';



import {go} from "gojs/release/go-module";
import { BormeClient } from './borme-http-client';
import { BormeGraphNetwork } from './network-adapter';
import { CompanyDetail, PersonDetail } from './borme-adapter';

const BORME_PROXIED_AT="http://localhost";


class MainLayout extends LitElement{
  constructor() {
    // Always call super() first
    super();

    // Initialize properties
    this.searchTypeActive=null;
    this.goGraph=go.GraphObject.make;
    this.myDiagram=null;
    this.nodeAdapter=new GoJsNodeAdapter(this);
    this.selectedNode=null;
    this.myNetworkMesh=new BormeGraphNetwork();
    this.updateComplete.then(() => { this._renderDiagramContainer()});

  }

  firstUpdated(changedProperties) {

    let drawer = this.shadowRoot.getElementById('myDrawer');
    let container = drawer.parentNode;
      container.addEventListener('MDCTopAppBar:nav', (e) => {
       drawer.open = !drawer.open;
    });

    this.addEventListener('addNodeToNetwork',(ev)=>{
      this.myDiagram.model.startTransaction("EventAddingNodes");
      console.log({event:'addNodeToNetwork',detail:ev.detail})
      let nodesToAdd=[];
      if(ev.detail.node!==undefined){
        let checkNodeExists=this.myDiagram.findNodeForKey(ev.detail.node.key);

        if(checkNodeExists!==null){
          this.myDiagram.model.commit(m=>m.removeNodeData(ev.detail.node));
        }
        this.myDiagram.model.addNodeData(ev.detail.node);
      }

      if(ev.detail.nodes!==undefined){
        ev.detail.nodes.forEach(node=>{

          let checkNodeExists=this.myDiagram.model.findNodeDataForKey(node.key);
          if(checkNodeExists!==null){
            console.log({NODE_EXISTS:{node:node,existingNode:checkNodeExists}});
          }else{
          this.myDiagram.model.addNodeData(node);
          }

        });


        ev.detail.relations.forEach(rel=>{
          if(this.myDiagram.model.findLinkDataForKey(rel.key)===null){
            this.myDiagram.model.addLinkData(rel);
          }

        });

        }
        this.myDiagram.model.addNodeDataCollection(nodesToAdd);
        this.myDiagram.model.commitTransaction("EventAddingNodes");
        this.myDiagram.layout.invalidateLayout();
        this.myDiagram.zoomToFit();
    });


    this.addEventListener("AddRelation",ev=>{
      this.myDiagram.startTransaction("AddRelation");
      let relation=ev.detail.relation;
      
      if(!this.myDiagram.findNodeForKey(relation.from.key)){
        if(relation.from.properties instanceof CompanyDetail){
          relation.from.type=NODE_TYPE_COMPANY;
          
        }
        if(relation.from.properties instanceof PersonDetail){
          relation.from.type=NODE_TYPE_PERSON;
        }
        relation.from.expanded=false;
        this.myDiagram.model.addNodeData(relation.from)
      }
      if(!this.myDiagram.findNodeForKey(relation.to.key)){
        if(relation.to.properties instanceof CompanyDetail){
          relation.to.type=NODE_TYPE_COMPANY;
        }
        if(relation.to.properties instanceof PersonDetail){
          relation.to.type=NODE_TYPE_PERSON;
        }
        relation.to.expanded=false;
        this.myDiagram.model.addNodeData(relation.to)
      }
      

      if(this.myDiagram.model.findLinkDataForKey(relation.key)===null){
        this.myDiagram.model.addLinkData({
          from:relation.from.key,
          to:relation.to.key,
          text:relation.label,
          pasive:relation.properties.date_to!==undefined?true:false,
          date_from:relation.properties.date_from,
          date_to:relation.properties.date_to,
          key:relation.key
        });
      }

      
      this.myDiagram.commitTransaction("AddRelation");
      this.myDiagram.zoomToFit();

    });


    this.addEventListener("LoadEmpresa",ev=>{
      console.log({LoadEmpresa:{ev:ev}});
    });

        /**
     * Búsqueda de empresas por expansion de hallazgo asociado a persona
     */
    this.addEventListener('expand-empresa', (ev)=>{
      //this._handleSearch(ev.detail.node.data.key.split("\n").join(" "),"empresa",ev.detail.node.data);
      BormeClient.loadEmpresaByUri(BORME_PROXIED_AT,ev.detail.node.data.properties.resource_uri,true,0.75,(company,item,cargo)=>{
        //this.myNetworkMesh.addNodeData(item);
        this.dispatchEvent(new CustomEvent("AddRelation",{detail:{
          relation:this.myNetworkMesh.addRelation(item,company,cargo)
        }
        }));
       });      
    });

    this.addEventListener('expand-person', (ev)=>{
      BormeClient.loadPersonaByUri(BORME_PROXIED_AT,ev.detail.node.data.properties.resource_uri,true,0.75,(persona,empresa,cargo)=>{
        if(persona.in_companies.includes(empresa.name+" "+empresa.type)){ 
        this.dispatchEvent(new CustomEvent("AddRelation",{detail:{
          relation:this.myNetworkMesh.addRelation(persona,empresa,cargo)
        }
        }));
        }else{
          throw Error("Company not found");
        }
      });
    }
    );

     /**
     * Búsqueda de empresas por expansion de hallazgo asociado a persona
     */
    this.addEventListener('expand-empresa-search', (ev)=>{
      console.log({empresa_confirmada:ev.detail});
      //this._handleCompanyDetails(ev.detail.node);
      BormeClient.loadEmpresaByUri(BORME_PROXIED_AT,ev.detail.node.data.resource_uri,true,0.75,(company,item,cargo)=>{
          //this.myNetworkMesh.addNodeData(item);
          this.dispatchEvent(new CustomEvent("AddRelation",{detail:{
            relation:this.myNetworkMesh.addRelation(item,company,cargo)
          }
          }));
         });
      this.myDiagram.model.removeNodeData(ev.detail.node.data);
    });




    this.addEventListener('expand-person-search', (ev)=>{
         // this._handlePersonDetails(ev.detail.node);
     BormeClient.loadPersonaByUri(BORME_PROXIED_AT,ev.detail.node.data.resource_uri,true,0.75,(persona,empresa,cargo)=>{
      if(persona.in_companies.includes(empresa.name+" "+empresa.type)){ 
      this.dispatchEvent(new CustomEvent("AddRelation",{detail:{
        relation:this.myNetworkMesh.addRelation(persona,empresa,cargo)
      }
      }));
    }
      this.myDiagram.model.removeNodeData(ev.detail.node.data);
    });
    });



    /**
     * Búsqueda de empresas identificadas como relativas a otra empresa
     */
    this.addEventListener('expand-empresa-title', (ev)=>{
      BormeClient.loadEmpresaByName(BORME_PROXIED_AT,ev.detail.node.data.searchTerm,true,0.75,myJson=>{
        let companyMesh=this.nodeAdapter.transformCompanyTo(myJson,{name:ev.detail.node.data.searchTerm});
        ev.detail.node.data=companyMesh.nodes[0];
        this.dispatchEvent(new CustomEvent('addNodeToNetwork', {
            detail: { nodes: companyMesh.nodes,relations:companyMesh.relations},
            bubbles: true,
            composed: true }));
      });
    });



        /**
     * Búsqueda de personas identificadas como relativas a otra empresa
     */
    this.addEventListener('expand-person-title', (ev)=>{
      console.log({empresa_confirmada_title:ev.detail});
      //this._handleSearch(ev.detail.node.data.searchTerm,"persona",ev.detail.node.data);
      if(!ev.detail.node.data.expanded){
          BormeClient.searchPersona(BORME_PROXIED_AT,ev.detail.node.data.searchTerm).then(data=>{
            let searchResults=this.nodeAdapter.transformPersonSearchResultsTo(data,ev.detail.node.data,ev.detail.node.data.searchTerm);
            searchResults.forEach(snode=>{
                if(snode.accuracy===1){ /// EXACT MATCH AUTO SEARCH
                  this._handlePersonDetails({data:snode});
                  this.myDiagram.model.removeNodeData(ev.detail.node.data);
                }else{
                  console.log({NODO_DESCARTADO:snode});
                }
            });

          });
          ev.detail.node.data.expanded=true;
    }
    });
  }





  static get styles() {
    return [Layouts,Positioning,Alignment,css`.light {
      --mdc-theme-on-primary: black;
      --mdc-theme-primary: #00867d;
      --mdc-theme-on-secondary: black;
      --mdc-theme-secondary: white;
    } .light-input{
      --mdc-theme-on-primary: black;
      --mdc-theme-primary: lightgreen;
      --mdc-theme-on-secondary: black;
      --mdc-theme-secondary: white;
    }`];
  }
  static get properties(){
    return {
      title:{type:String},
      searchTypeActive:{type:String},
      selectedNode:{type:Object}
    };
  }

  _renderDiagramContainer(){

    console.log("Rendering diagram container....");
    this.myDiagram=this.goGraph(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
    {
      initialContentAlignment: go.Spot.Center,
      "toolManager.hoverDelay": 100,
      layout: this.goGraph(go.ForceDirectedLayout,{ arrangesToOrigin:false,isInitial:true,isViewportSized:false
        ,maxIterations: 20000, defaultSpringLength: 500, defaultElectricalCharge:1500,epsilonDistance:0.5 }),
      // moving and copying nodes also moves and copies their subtrees
      "commandHandler.copiesTree": true,  // for the copy command
      "commandHandler.deletesTree": true, // for the delete command
      "draggingTool.dragsTree": true,  // dragging for both move and copy
      "undoManager.isEnabled": true,

    });

    /*this.myDiagram.toolManager.draggingTool.doMouseMove = function() {
      go.DraggingTool.prototype.doMouseMove.call(this);
      if (this.isActive) { this.diagram.layout.invalidateLayout(); }
    }*/

     // Define the Node template.
      // This uses a Spot Panel to position a button relative
      // to the ellipse surrounding the text.
      this.myDiagram.nodeTemplate =
        this.goGraph(go.Node, "Spot",
          {
            selectionObjectName: "PANEL",
            isTreeExpanded: true,
            isTreeLeaf: false,
            click: (e, obj)=> {  // OBJ is the Button
              var node = obj.part;  // get the Node containing this Button
              if (node === null) return;
              this.selectedNode=node.data;
              e.handled = true;

            },

            mouseHover:(e, obj)=> {  // OBJ is the Button
              var node = obj.part;  // get the Node containing this Button
              if (node === null) return;
              
              

              let lastNodeSel=null;
              /// ELIMINAR EL STROKE ANCHO
              if(this.selectedNode!==undefined && this.selectedNode!==null){
              lastNodeSel=this.myDiagram.findNodeForKey(this.selectedNode.key);
              }

              if(lastNodeSel!==undefined && lastNodeSel!==null){
                lastNodeSel.findLinksConnected().each(link=>{
                    link.path.strokeWidth="1";   
                });
                if(lastNodeSel.data.expanded){
                  lastNodeSel.opacity="0.5";
                }

              }
              this.selectedNode=node.data;
              e.handled = true;


              node.opacity="0.9";

              node.findLinksConnected().each(link=>{
                link.path.strokeWidth="5";
                
              });

            }
          },
          // the node's outer shape, which will surround the text
          this.goGraph(go.Panel, "Auto",
            { name: "PANEL" },
            this.goGraph(go.Shape, "Circle",
              { fill: "whitesmoke", stroke: "black" },

              new go.Binding("strokeDashArray", "type", function(type) {
                let oVal=null;
                if(type==='empresa' || type===("empresa-title") || type==="person-title"){
                  oVal=new Array();
                  oVal.push(5);
                  oVal.push(10);
                }
                return oVal;
              }),

              new go.Binding("stroke", "", function(data) {
                let oVal=null;
                if(data.type==='person-search'){
                  oVal="#00701a";
                }
                if(data.type==='empresa-confirmada'){
                  oVal="#007c91";
                }
                if(data.type==="empresa-search"){
                  oVal="#007c91";
                }
                if(data.type==='person-title'){
                  oVal="#8c9900";
                }

                if(data.type==='empresa-title'){
                  oVal="#8c9900";
                }
                if(data.parent===""){
                  oVal="#e91e63";
                }

                return oVal;
              })
              ,
              new go.Binding("strokeWidth", "", function(data,node) {
                if(data.accuracy!==undefined && data.accuracy>0.83){
                  return data.accuracy*10;
                }else{
                  if(data.parent===""){
                    return 800;
                  }
                  return 0.3;
                }

              }),

              new go.Binding("opacity","",function(data,node){
                
                if(data.expanded===true){
                  return 0.3;
                }else{
                  return 0.9;
                }
              }),
              new go.Binding("fill", "", function(data,node) {
                let oVal=null;
                if(data.type==="person-search"){
                  oVal="#76d275";
                }
                if(data.type==="person"){
                  oVal="#c0ca33";
                }
                if(data.type==='person-title'){
                  oVal="#f5fd67";
                }

                if(data.type==='empresa-title'){
                  oVal="#c0ca33";
                }

                if(data.type==='empresa-confirmada' || data.type==='empresa-search'){
                  oVal="#00acc1";
                }
                if(data.type==='empresa' ){
                  oVal="#5ddef4";
                }

                return oVal;
              })
              ),
              this.goGraph(go.TextBlock,
              { font: '12pt sans-serif', margin: 5 },

              new go.Binding("text", "",function(data,node){
                return ((data.title===undefined?"":data.title)+"\n\n"+data.key+"\n\n"+data.type.split("-").join("\n")).toLocaleUpperCase();
              })

              )
          ),
          // the expand/collapse button, at the top-right corner
          this.goGraph("TreeExpanderButton",
            {
              name: 'TREEBUTTON',
              width: 110, height: 110,
              alignment: go.Spot.TopRight,
              alignmentFocus: go.Spot.Center,
              // customize the expander behavior to
              // create children if the node has never been expanded
              click: (e, obj)=> {  // OBJ is the Button
                
                var node = obj.part;  // get the Node containing this Button
                
                
                if (node === null) return;
                e.handled = true;
                if(!node.data.expanded){
                    this.dispatchEvent(new CustomEvent('expand-'+node.data.type, {
                      detail: { node: node },
                      bubbles: true,
                      composed: true }));
                      node.data.expanded=true;
                      node.opacity=0.5;
                }
            }
            }
          )  // end TreeExpanderButton
        );  // end Node


        this.myDiagram.linkTemplate =
        this.goGraph(go.Link, {}, // the whole link panel
          this.goGraph(go.Shape,  // the link shape
            { stroke: "black",strokeWidth: 1 }
            ,
              new go.Binding("strokeDashArray","",(data,link)=>{
                  if(data.pasive===true){
                    return [5,10];
                  }
                  return null;
              })
            ),

            this.goGraph(go.Shape,  // the arrowhead
            { toArrow: "standard", stroke: null,scale:2 }),
            
            this.goGraph(go.Panel, "Auto",
            this.goGraph(go.Shape,  // the label background, which becomes transparent around the edges
              {
                fill: this.goGraph(go.Brush, "Radial", { 0: "rgb(240, 240, 240)", 0.3: "rgb(240, 240, 240)", 1: "rgba(240, 240, 240, 0)" }),
                stroke: null
              }),
              this.goGraph(go.TextBlock,  // the label text
              {
                textAlign: "center",
                font: "10pt helvetica, arial, sans-serif",
                stroke: "#555555",
                margin: 4
              },
              new go.Binding("text", "",(data,link)=>{
                return data.text+"\n"+data.date_from+(data.pasive?"\n"+data.date_to:"");
              })
              )
          )
        );

  }



  _handleSearch(searchTerm,type,rootNode,replaceParent){
    console.log({handleSearch:{rootNode:rootNode}});
    var myHeaders = new Headers();
    /*myHeaders.set('Content-Type', 'application/json');
    myHeaders.set('Access-Control-Allow-Origin','*');
    myHeaders.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');*/
    myHeaders.set('Origin',"localhost");

    fetch(BORME_PROXIED_AT+'/borme/api/v1/'+(type===null?this._getSearchType():type)+'/search/?q='+searchTerm+'&page=1',
    {
      method:'GET',
      mode: 'cors',
      redirect:'follow',
      headers: myHeaders
    })
       .then(function(response) {
        return response.json();
       })
       .then(myJson=>{
        console.log(myJson);


           /// TEST MODEL

        if(this.myDiagram.model.nodeDataArray.length===0){
         //this.myDiagram.model=this.goGraph(go.TreeModel);
         var model=new go.GraphLinksModel();
         model=this.goGraph(go.GraphLinksModel);
         model.linkToKeyProperty="to";
         model.linkFromKeyProperty="from";
         model.linkKeyProperty="key";
         this.myDiagram.model=model;
       }
       this.myDiagram.startTransaction("fillWithSearchResults");
       if(type==='persona'){
 //       this.myDiagram.model.addNodeDataCollection(this._transformSearchPersonsToNode(myJson.objects,rootNode===null?{key:searchTerm,type:"search"}:rootNode));

        this.myDiagram.model.addNodeDataCollection(this.nodeAdapter.transformPersonSearchResultsTo(myJson,rootNode,searchTerm));
       }
       if(type==='empresa'){
//        this.myDiagram.model.addNodeDataCollection(this._transformSearchEmpresaToNode(myJson.objects,rootNode===null?{key:searchTerm,type:"search"}:rootNode));
        this.myDiagram.model.addNodeDataCollection(this.nodeAdapter.transformCompaniesSearchResultsTo(myJson,rootNode,searchTerm));
       }

       this.myDiagram.commitTransaction("fillWithSearchResults");
       this.myDiagram.zoomToFit();

      });/*.catch(function(error) {
          console.log('Hubo un problema con la petición Fetch:' + error.message);
        });;*/
  }

  _transformSearchPersonsToNode(persons,rootNode){
    //let oVal=[{key:rootNode,type:'search'}];
    let oVal=[];
    for(let i=0;i<persons.length;i++){
      oVal.push({
        type:'person',
        resource_uri:persons[i].resource_uri,
        slug:persons[i].slug,
        key:persons[i].name.split(" ").join("\n"),
        parent:rootNode.type==="search"?"":rootNode.key
      });
    }

  return oVal;}


  _transformSearchEmpresaToNode(companies,rootNode){
    //let oVal=[{key:rootNode,type:'search'}];
    let oVal=[];
    for(let i=0;i<companies.length;i++){
      oVal.push({
        type:'empresa-confirmada',
        resource_uri:companies[i].resource_uri,
        slug:companies[i].slug,
        key:companies[i].name.split(" ").join("\n"),
        parent:rootNode.type==="search"?"":rootNode.key
      });
    }

  return oVal;}



  _transformCompaniesToNode(companies,rootNode){
    let oVal=[];
    for(let i=0;i<companies.length;i++){
      oVal.push({
        type:'empresa',
        resource_uri:BORME_PROXIED_AT+'/borme/api/v1/'+'empresa'+'/search/?q='+companies[i]+'&page=1',
        slug:companies[i].split(" ").join("-"),
        key:companies[i].split(" ").join("\n"),
        parent:rootNode
      });
    }

  return oVal;}

  _handleCompanyDetails(rootNode){

    if(rootNode.data.expanded===false || rootNode.data.expanded===undefined){
      BormeClient.loadEmpresa(BORME_PROXIED_AT,rootNode.data.resource_uri)
         .then(myJson=>{
          this.myDiagram.startTransaction("CollapseExpandTree");
          console.log(myJson);
             /// TEST MODEL
         let myModel = this.myDiagram.model;
         console.log({dataNode:rootNode.data,parent:rootNode});


      // in the model data, each node is represented by a JavaScript object:

         let companyMesh=this.nodeAdapter.transformCompanyTo(myJson,{name:rootNode.data.search_term});
          this.dispatchEvent(new CustomEvent('addNodeToNetwork', {
              detail: { nodes: companyMesh.nodes,relations:companyMesh.relations},
              bubbles: true,
              composed: true }));

       //  myModel.addNodeDataCollection(this.nodeAdapter.transformCompanyTo(myJson,rootNode.data));
         rootNode.data.expanded=true;
         myModel.removeNodeData(rootNode.data);


        this.myDiagram.commitTransaction("CollapseExpandTree");
        this.myDiagram.zoomToFit();
          });/*.catch(function(error) {
            console.log('Hubo un problema con la petición Fetch:' + error.message);
          });;*/
        }

  }

  /**
   * Fetch details for person data node type
   * @param {*} rootNode
   */
  _handlePersonDetails(rootNode){
    if(rootNode.data.expanded===false || rootNode.data.expanded===undefined){
      this.myDiagram.model.removeNodeData(rootNode.data);
      fetch(BORME_PROXIED_AT+rootNode.data.resource_uri,
      {
        method:'GET',
        mode: 'cors',
        redirect:'follow'
      })
         .then(function(response) {
          return response.json();
         })
         .then(myJson=>{
          this.myDiagram.startTransaction("Expand-"+rootNode.data.type);
             /// TEST MODEL
         let myModel = this.myDiagram.model;



      // in the model data, each node is represented by a JavaScript object:
         //myModel.removeNodeData(rootNode.data);

         // V.0
        /* this.nodeAdapter.transformPersonToNetwork(myJson,rootNode.data).forEach((node)=>{
           console.log({node:node});
          let myModel = this.myDiagram.model;
            if(myModel.findNodeDataForKey(node.key)===null){
              myModel.addNodeData(node);
            }
         });*/

        this.nodeAdapter.transformPersonToNetwork(myJson,rootNode.data).then(
           nodeArray =>{
            nodeArray.forEach((node)=>{
             let myModel = this.myDiagram.model;
               if(myModel.findNodeDataForKey(node.key)===null){
                 myModel.addNodeData(node);
               }
           });

           rootNode.data.expanded=true;
           myModel.removeNodeData(rootNode.data);
           this.myDiagram.commitTransaction("Expand-"+rootNode.data.type);
           this.myDiagram.zoomToFit();

          }
         );

         //myModel.addNodeDataCollection(this.nodeAdapter.transformPersonTo(myJson,rootNode.data));





          });/*.catch(function(error) {
            console.log('Hubo un problema con la petición Fetch:' + error.message);
          });;*/
        }

  }





  _transformCargosToNode(empresa,rootNodeData){
    let oVal=[];

    // Cargos de empresa personas
    if(empresa.cargos_actuales_p.length>0){
      for(let i=0;i<empresa.cargos_actuales_p.length;i++){
        oVal.push({
          type:'person-title',
          key:(empresa.cargos_actuales_p[i].name.split(" ").join("\n")),
          title:empresa.cargos_actuales_p[i].title,
          defaultElectricalCharge:300,
          parent:rootNodeData===null?"":rootNodeData.key
        })
      }
    }
    // Cargos de empresa empresas
    if(empresa.cargos_actuales_c.length>0){
      for(let i=0;i<empresa.cargos_actuales_c.length;i++){
        oVal.push({
          type:'empresa-title',
          key:(empresa.cargos_actuales_c[i].name.split(" ").join("\n")),
          title:empresa.cargos_actuales_c[i].title,

          parent:rootNodeData===null?"":rootNodeData.key
        })
      }
    }

    return oVal;
  }

  _getSearchType(){
    this.requestUpdate();

    if(this.searchTypeActive==null){
      // TODO:
    }
    else{
      return this.searchTypeActive;
    }

  }

  _handleSearchBoxKeys(key,target,type){
    if(key==="Enter"){
        this._handleSearch(target.value,type,null);
      }
  }



  render_selected_node_details(){
    let oVal=[];
    if(this.selectedNode!==null){

      let propName=Object.getOwnPropertyNames(this.selectedNode);
      for(let i=0;i<propName.length;i++){
        oVal.push(html`<tr style="padding-bottom:8px;"><td>${propName[i]}</td><td>${JSON.stringify(this.selectedNode[propName[i]],null,"\t")}</td></tr>`);
   /*    oVal.push(html `<li>1</li><li style="flex: 0 0 50%;
       border: 1px solid grey;
       padding: 1em;
       display: flex;
       align-items: flex-end;">${propName[i]} - ${JSON.stringify(this.selectedNode[propName[i]],null,"\t")} </li>`)*/
      }
    }
     return html `<table style="font:12px Roboto;border-bottom:1px solid silver;opacity:0.58">
        <thead >
          <tr><th style="align:center">Property</th><th>Value</th></tr>
          ${oVal}
        </thead>
      </table>`;
      /*
      return html`<ul style=" list-style-type: none;
      width: 100%;
      display: flex;
      flex-wrap: wrap;">
        ${oVal}
      </ul>`*/
  }




  render_top_bar(){
    return html` <mwc-top-app-bar class="light">
    <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
    <div slot="title" id="title">${this.title}</div>
    ${this.searchTypeActive==="persona"?html`<mwc-textfield label="Búsqueda" icon="people" slot="actionItems"
    placeholder="Persona o empresa a buscar"

    @keydown=${(ev)=>this._handleSearchBoxKeys(ev.key,ev.target,"persona")}
    box
    class="light-input"></mwc-textfield>
    `:this.searchTypeActive==="empresa"?html`<mwc-textfield label="Búsqueda" icon="account_balance" slot="actionItems"
    placeholder="Persona o empresa a buscar"
        @keydown=${(ev)=>this._handleSearchBoxKeys(ev.key,ev.target,"empresa")}
    box
    class="light-input"></mwc-textfield>
    `:html`<mwc-textfield label="Búsqueda" icon="search" slot="actionItems"
    placeholder="Persona o empresa a buscar"

    @keydown=${(ev)=>this._handleSearchBoxKeys(ev.key,ev.target)}
    box
    class="light-input"></mwc-textfield>`}
    <mwc-icon-button icon="people" slot="actionItems" @click=${(ev)=>this.searchTypeActive="persona"}></mwc-icon-button>
    <mwc-icon-button icon="account_balance" slot="actionItems" @click=${(ev)=>this.searchTypeActive="empresa"}></mwc-icon-button>
    <mwc-icon-button icon="clear" slot="actionItems" @click=${(ev)=>{this.myDiagram.model.nodeDataArray=[];this.myDiagram.model.linkDataArray=[];}}></mwc-icon-button>
  </mwc-top-app-bar>`;
  }

  render_drawer(){
    return html``;
  }
  render(){

    return html`

    <!-- template content -->
    <mwc-drawer hasHeader type="dismissible" id="myDrawer">
    <span slot="title">LibreBor.me</span>
    <span slot="subtitle">Graph Analizer</span>
    <div class="drawer-content">
      <p>Drawer content</p>
      <mwc-icon-button icon="gesture"></mwc-icon-button>
      <mwc-icon-button icon="gavel" id="gavel"></mwc-icon-button>
    </div>

      <div class="layout vertical wrap" slot="appContent">
      ${this.render_top_bar()}
      <div class="layout horizontal wrap ">
      <slot name="graphContainer"></slot>
      <div class="layout vertical wrap" style="width:38%;">
      <div style="border:1px solid silver;border-radius:3px;margin-top:60px;margin-left:8px;margin-right:8px;">
        <div slot="header" style="font:medium Roboto;padding:4px;opacity:0.78;text-align: center;">Detalles del nodo seleccionado</div>
        <div slot="content" style="padding:4px;">
        ${this.render_selected_node_details()}
        </div>
        <button @click=${(ev)=>{this._getNetworkMesh();}}>GetNetworkMesh</button>
        <button @click=${(ev)=>{console.log({tree:GojsModelManager.getFlatTree(this.myDiagram,this.selectedNode)})}}>Gen-Tree</button>
        <button @click=${(ev)=>{console.log({tree:CypherProcessor.cypherTree(GojsModelManager.getFlatTree(this.myDiagram,this.selectedNode)
          ,(rootNode,childNode)=>{
            if(rootNode.type===NODE_TYPE_PERSON){
              if(childNode.type===NODE_TYPE_COMPANY_TITLE){
                //return {var:null,props:null,label:childNode.title.replace(" ","").replace(new RegExp("\\.","g"),"_"),direction:"->"};
                return {var:null,props:null,label:"OCUPA_EL_CARGO",direction:"->"};
              }
            }

            if(rootNode.type===NODE_TYPE_COMPANY_TITLE){
              if(childNode.type===NODE_TYPE_COMPANY){
                //return {var:null,props:null,label:childNode.title.replace(" ","").replace(new RegExp("\\.","g"),"_"),direction:"->"};
                return {var:null,props:null,label:"EN_LA_EMPRESA",direction:"->"};
              }
            }
            if(rootNode.type===NODE_TYPE_COMPANY){
              if(childNode.type===NODE_TYPE_PERSON_TITLE){
                //return {var:null,props:null,label:childNode.title.replace(" ","").replace(new RegExp("\\.","g"),"_"),direction:"->"};
                return {var:null,props:null,label:"TIENE_EN_EL_CONSEJO_COMO",direction:"->"};
              }

              if(childNode.type===NODE_TYPE_COMPANY_TITLE){
                //return {var:null,props:null,label:childNode.title.replace(" ","").replace(new RegExp("\\.","g"),"_"),direction:"->"};
                return {var:null,props:null,label:"OCUPA_EL_CARGO_DE",direction:"->"};
              }



            }
            if(rootNode.type===NODE_TYPE_PERSON_TITLE){
              if(childNode.type===NODE_TYPE_COMPANY){
                //return {var:null,props:null,label:childNode.title.replace(" ","").replace(new RegExp("\\.","g"),"_"),direction:"->"};
                return {var:null,props:null,label:"EN_LA_EMPRESA",direction:"->"};
              }
              if(childNode.type===NODE_TYPE_PERSON){
                //return {var:null,props:null,label:childNode.title.replace(" ","").replace(new RegExp("\\.","g"),"_"),direction:"->"};
                return {var:null,props:null,label:"OCUPA_EL_CARGO",direction:"<-"};
              }
            }

            return {var:null,props:null,label:"ParentChild",direction:"->"};
          },"processed").join("")})}}>Gen-Cypher</button>
      </div>
      </div>
      </div>

      <div class="main-content">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </div>
      </div>

      </mwc-drawer>
  `;
  }

  _getNetworkMesh(){
    let network=new go.ForceDirectedNetwork(this.myDiagram.layout);
    console.log(network.vertexes);
  }



}


customElements.define('app-borme-layout', MainLayout);
