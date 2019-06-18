import { LitElement, html, css } from 'lit-element';
import {Layouts,Positioning,Alignment} from 'lit-flexbox-literals';         /// SOPORTE PARA FLEXBOX LAYOUTS
import {TopAppBar} from "@authentic/mwc-top-app-bar";
import {IconButton} from "@authentic/mwc-icon-button";
import {TextField} from "@authentic/mwc-textfield";

import {go} from "gojs/release/go-module";


class MainLayout extends LitElement{
  constructor() {
    // Always call super() first
    super();

    // Initialize properties
    this.searchTypeActive=null;
    this.goGraph=go.GraphObject.make;
    this.myDiagram=null;

    this.updateComplete.then(() => { this._renderDiagramContainer()});

  }

  firstUpdated(changedProperties) {
    this.addEventListener('expand-person', (ev)=>{
      fetch('http://localhost'+ev.detail.node.data.resource_uri,
      {
        method:'GET',
        mode: 'cors',
        redirect:'follow'
      })
         .then(function(response) {
          return response.json();
         })
         .then(myJson=>{
          this.myDiagram.startTransaction("CollapseExpandTree");
          console.log(myJson);
             /// TEST MODEL
         let myModel = this.myDiagram.model;

         let parent = ev.detail.node;
         console.log({dataNode:ev.detail.node.data,parent:parent});


      // in the model data, each node is represented by a JavaScript object:
         myModel.addNodeDataCollection(this._transformCompaniesToNode(myJson.in_companies,ev.detail.node.data.key));
        this.myDiagram.commitTransaction("CollapseExpandTree");
          });/*.catch(function(error) {
            console.log('Hubo un problema con la petición Fetch:' + error.message);
          });;*/
    }
    );



    this.addEventListener('expand-search',
      (ev)=>{console.log({expandedempresa:ev})}
   );


    /**
     * Búsqueda de empresas por expansion de hallazgo asociado a persona
     */
    this.addEventListener('expand-empresa', (ev)=>{
      this._handleSearch(ev.detail.node.data.key.split("\n").join(" "),"empresa",ev.detail.node.data);
    });

     /**
     * Búsqueda de empresas por expansion de hallazgo asociado a persona
     */
    this.addEventListener('expand-empresa-confirmada', (ev)=>{
      console.log({empresa_confirmada:ev.detail});
      this._handleCompanyDetails(ev.detail.node);
    });


    /**
     * Búsqueda de empresas identificadas como relativas a otra empresa
     */
    this.addEventListener('expand-empresa-title', (ev)=>{
      console.log({empresa_confirmada_title:ev.detail});
      this._handleSearch(ev.detail.node.data.key.split("\n").join(" "),"empresa",ev.detail.node.data);
    });

        /**
     * Búsqueda de personas identificadas como relativas a otra empresa
     */
    this.addEventListener('expand-person-title', (ev)=>{
      console.log({empresa_confirmada_title:ev.detail});
      this._handleSearch(ev.detail.node.data.key.split("\n").join(" "),"persona",ev.detail.node.data);
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
      searchTypeActive:{type:String}
    };
  }

  _renderDiagramContainer(){
    
    console.log("Rendering diagram container....");
    this.myDiagram=this.goGraph(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
    {
      initialContentAlignment: go.Spot.Center,
      layout: this.goGraph(go.ForceDirectedLayout,{ arrangesToOrigin:false
        ,maxIterations: 200, defaultSpringLength: 1000, defaultElectricalCharge: 1000 }),
      // moving and copying nodes also moves and copies their subtrees
      "commandHandler.copiesTree": true,  // for the copy command
      "commandHandler.deletesTree": true, // for the delete command
      "draggingTool.dragsTree": true,  // dragging for both move and copy
      "undoManager.isEnabled": true,
      
    });

     // Define the Node template.
      // This uses a Spot Panel to position a button relative
      // to the ellipse surrounding the text.
      this.myDiagram.nodeTemplate =
        this.goGraph(go.Node, "Spot",
          {
            selectionObjectName: "PANEL",
            isTreeExpanded: true,
            isTreeLeaf: false
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
              new go.Binding("strokeWidth", "type", function(type) {
                let oVal=null;
                if(type==='empresa-confirmada'){
                  oVal=3;
                }
                return oVal;
              }),

              new go.Binding("stroke", "type", function(type) {
                let oVal=null;
                if(type==='person'){
                  oVal="#00701a";
                }
                if(type==='empresa-confirmada'){
                  oVal="#007c91";
                }
                if(type==='empresa'){
                  oVal="#007c91";
                }
                if(type==='person-title'){
                  oVal="#8c9900";
                }

                if(type==='empresa-title'){
                  oVal="#8c9900";
                }

                return oVal;
              }),
              new go.Binding("fill", "type", function(type) {
                let oVal=null;
                if(type==='person'){
                  oVal="#76d275";
                }
                if(type==='person-title'){
                  oVal="#f5fd67";
                }

                if(type==='empresa-title'){
                  oVal="#c0ca33";
                }

                if(type==='empresa-confirmada'){
                  oVal="#00acc1";
                }
                if(type==='empresa'){
                  oVal="#5ddef4";
                }
                return oVal;
              })),
              this.goGraph(go.TextBlock,
              { font: "12pt Roboto,sans-serif", margin: 5 },
              new go.Binding("text", "",function(data,node){
                return (data.title===undefined?"":data.title)+"\n\n"+data.key+"\n\n"+data.type.split("-").join("\n");
              }),
              

              new go.Binding("opacity","type",function(type){
                return type==='person'?"0.7":"0.7";
              })
              
              )
          ),
          // the expand/collapse button, at the top-right corner
          this.goGraph("TreeExpanderButton",
            {
              name: 'TREEBUTTON',
              width: 20, height: 20,
              alignment: go.Spot.TopRight,
              alignmentFocus: go.Spot.Center,
              // customize the expander behavior to
              // create children if the node has never been expanded
              click: (e, obj)=> {  // OBJ is the Button
                var node = obj.part;  // get the Node containing this Button
                if (node === null) return;
                e.handled = true;
                this.dispatchEvent(new CustomEvent('expand-'+node.data.type, { 
                  detail: { node: node },
                  bubbles: true, 
                  composed: true }));
              }
            }
          )  // end TreeExpanderButton
        );  // end Node


  }



  _handleSearch(searchTerm,type,rootNode,replaceParent){
    var myHeaders = new Headers();
    /*myHeaders.set('Content-Type', 'application/json');
    myHeaders.set('Access-Control-Allow-Origin','*');
    myHeaders.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');*/

    fetch('http://localhost/borme/api/v1/'+(type===null?this._getSearchType():type)+'/search/?q='+searchTerm+'&page=1',
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
         this.myDiagram.model=this.goGraph(go.TreeModel);     
       }
       this.myDiagram.startTransaction("fillWithSearchResults");
       if(type==='persona'){
        this.myDiagram.model.addNodeDataCollection(this._transformSearchPersonsToNode(myJson.objects,rootNode===null?{key:searchTerm,type:"search"}:rootNode));
       }
       if(type==='empresa'){
        this.myDiagram.model.addNodeDataCollection(this._transformSearchEmpresaToNode(myJson.objects,rootNode===null?{key:searchTerm,type:"search"}:rootNode));
       } 

       this.myDiagram.commitTransaction("fillWithSearchResults");

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
        resource_uri:'http://localhost/borme/api/v1/'+'empresa'+'/search/?q='+companies[i]+'&page=1',
        slug:companies[i].split(" ").join("-"),
        key:companies[i].split(" ").join("\n"),
        parent:rootNode
      });
    }

  return oVal;}

  _handleCompanyDetails(rootNode){
    if(rootNode.data.expanded===false || rootNode.data.expanded===undefined){
    
      fetch('http://localhost'+rootNode.data.resource_uri,
      {
        method:'GET',
        mode: 'cors',
        redirect:'follow'
      })
         .then(function(response) {
          return response.json();
         })
         .then(myJson=>{
          this.myDiagram.startTransaction("CollapseExpandTree");
          console.log(myJson);
             /// TEST MODEL
         let myModel = this.myDiagram.model;
         console.log({dataNode:rootNode.data,parent:rootNode});


      // in the model data, each node is represented by a JavaScript object:
     
         myModel.addNodeDataCollection(this._transformCargosToNode(myJson,rootNode.data));
         rootNode.data.expanded=true;
      
        this.myDiagram.commitTransaction("CollapseExpandTree");
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
    <mwc-icon-button icon="clear" slot="actionItems" @click=${(ev)=>this.myDiagram.model.nodeDataArray=[]}></mwc-icon-button>
  </mwc-top-app-bar>`;
  }
  render(){
    
    return html`

    <!-- template content -->

      <div class="layout vertical wrap" >
      ${this.render_top_bar()}
      <slot name="graphContainer"></slot>
      </div>
  `;
  }
}


customElements.define('app-borme-layout', MainLayout);
