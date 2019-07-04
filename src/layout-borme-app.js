import { LitElement, html, css } from 'lit-element';
import {Layouts,Positioning,Alignment} from 'lit-flexbox-literals';         /// SOPORTE PARA FLEXBOX LAYOUTS
import {TopAppBar} from "@authentic/mwc-top-app-bar";
import {IconButton} from "@authentic/mwc-icon-button";
import {TextField} from "@authentic/mwc-textfield";
import {Card} from "@authentic/mwc-card";
import {Drawer} from "@authentic/mwc-drawer";
import {TabBar} from "@authentic/mwc-tab-bar"
import {Tab} from "@authentic/mwc-tab"

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
import { BormeGraphNetwork, CypherGraphNetwork } from './network-adapter';
import { CompanyDetail, PersonDetail } from './borme-adapter';

const BORME_PROXIED_AT="http://localhost:8080";


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

    /**
     * Búsqueda de empresas por expansion de hallazgo asociado a persona
     */
    this.addEventListener('expand-empresa', (ev)=>{
      //this._handleSearch(ev.detail.node.data.key.split("\n").join(" "),"empresa",ev.detail.node.data);
      BormeClient.loadEmpresaByUri(BORME_PROXIED_AT,ev.detail.node.data.properties.resource_uri,true,0.75,(company,item,cargo)=>{
        //this.myNetworkMesh.addNodeData(item);
       /* this.dispatchEvent(new CustomEvent("AddRelation",{detail:{
          relation:this.myNetworkMesh.addRelation(item,company,cargo)
          }));
        }*/
        if(item instanceof PersonDetail){
          if(item.in_companies.includes(company.name+" "+company.type)){
            this.dispatchEvent(new CustomEvent("AddRelation",{detail:{
              relation:this.myNetworkMesh.addRelation(item,company,cargo)
            }
          }));
          }
        }
        if(item instanceof CompanyDetail){
          if(item.in_companies.includes(company.name+" "+company.type)){
            this.dispatchEvent(new CustomEvent("AddRelation",{detail:{
              relation:this.myNetworkMesh.addRelation(item,company,cargo)
            }
            }));
          }
        }

       });
    });

    /**
     * Expansión de un nodo tipo person
     */
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
          if(item instanceof PersonDetail){
            if(item.in_companies.includes(company.name+" "+company.type)){
              this.dispatchEvent(new CustomEvent("AddRelation",{detail:{
                relation:this.myNetworkMesh.addRelation(item,company,cargo)
              }
            }));
            }
          }
          if(item instanceof CompanyDetail){
            if(item.in_companies.includes(company.name+" "+company.type)){
              this.dispatchEvent(new CustomEvent("AddRelation",{detail:{
                relation:this.myNetworkMesh.addRelation(item,company,cargo)
              }
              }));
            }
          }

         });
      this.myDiagram.model.removeNodeData(ev.detail.node.data);
    });




    this.addEventListener('expand-person-search', (ev)=>{

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

  /**
   * Renderizado del contenedor del diagrama. TODO: SACAR Y REFACTORIZAR EN UN LIT APARTE
   */
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
              { font: '24pt Roboto,sans-serif', margin: 5 },

              new go.Binding("text", "",function(data,node){
                return ((data.title===undefined?"":data.title)+"\n\n"+data.key.split("-").join("\n")+"\n\n").toUpperCase();
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



  /**
   * Method to search into borme api.
   * TODO: Refactor this to use borme-http-client.
   */
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

  /**
   * Method to return the search type active on main ui.
   */
  _getSearchType(){
    this.requestUpdate();

    if(this.searchTypeActive==null){
      // TODO:
    }
    else{
      return this.searchTypeActive;
    }

  }

  /**
   * Method to control enter key into textbox, to launch the search
   */
  _handleSearchBoxKeys(key,target,type){
    if(key==="Enter"){
        this._handleSearch(target.value,type,null);
      }
  }



  /**
   * Renderizado de la tarjeta con los detalles del nodo.
   */
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
     return html `
     <mwc-tab-bar activeIndex="2">
      <mwc-tab label="Nodes" icon="extension"></mwc-tab>
      <mwc-tab label="Details" icon="list"></mwc-tab>
    </mwc-tab-bar>
    <table style="font:12px Roboto;border-bottom:1px solid silver;opacity:0.58">
        <thead >
          <tr><th style="align:center">Property</th><th>Value</th></tr>
          ${oVal}
        </thead>
      </table>
    `;
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
        <!--<div slot="header" style="font:medium Roboto;padding:4px;opacity:0.78;text-align: center;">Detalles del nodo seleccionado</div>-->
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
    let cypherNet=new CypherGraphNetwork(this.myNetworkMesh.relationMap,this.myNetworkMesh.nodesMap);

    console.log({cypherNet:cypherNet.createNetwork()});
    let driver=neo4j.v1.driver("bolt://xxx.xxx.xxx.xxx:7687", neo4j.v1.auth.basic("", ""));
    let session=driver.session();
    session.run(cypherNet.createNetwork())
    .then(function (result) {
      result.records.forEach(function (record) {
        console.log(record.get('p'));
      });
      session.close();
    })
    .catch(function (error) {
      console.log(error);
      session.close();
    });

  }



}


customElements.define('app-borme-layout', MainLayout);
