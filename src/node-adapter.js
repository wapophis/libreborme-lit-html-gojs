import {SearchResultSet,PersonDetail, CompanyDetail} from './borme-adapter';
import {BormeClient} from './borme-http-client';
import {sleeper} from './utils';

import {levenshteinDistance,damerauLevensteing, segmentedDistance, jarowinklerDistance} from './utils';

export const NODE_TYPE_PERSON_SEARCH_RESULT="person-search";
export const NODE_TYPE_COMPANIES_SEARCH_RESULT="empresa-search";
export const NODE_TYPE_PERSON_TITLE="person-title";
export const NODE_TYPE_COMPANY_TITLE="empresa-title";
export const NODE_TYPE_COMPANY="empresa";
export const NODE_TYPE_PERSON="person";


export class GoJsNodeAdapter  {

    constructor(eventsTarget){
        this.eventsTarget=eventsTarget;
    }

    /**
     * Transformación de los resultados de búsqueda a nodos de tipo búsqueda para personas
     * @param {*} inputArray
     * @param {*} rootNodeData
     */
    transformPersonSearchResultsTo(inputArray,rootNodeData,searchTerm){
        let oVal=[];
        let searchResultSet=new SearchResultSet(inputArray,NODE_TYPE_PERSON_SEARCH_RESULT);

        for(let i=0;i<searchResultSet.objects.length;i++){
            oVal.push({
                type:NODE_TYPE_PERSON_SEARCH_RESULT,
                key:"search-"+searchResultSet.objects[i].slug,
                resource_uri:searchResultSet.objects[i].resource_uri,
                search_term:searchTerm,
                expanded:false,
                accuracy:Math.max(jarowinklerDistance(searchResultSet.objects[i].slug.split("-").join("").toUpperCase(),searchTerm.split(" ").join("").toUpperCase()),jarowinklerDistance(searchResultSet.objects[i].slug.split("-").reverse().join("").toUpperCase(),searchTerm.split(" ").join("").toUpperCase())),
                parent:rootNodeData===null?"":rootNodeData.key
            });

       /*     console.log({
                pond:1-Math.min((levenshteinDistance(searchResultSet.objects[i].slug.split("-").join(" "),searchTerm)/searchResultSet.objects[i].slug.split("-").join(" ").length),levenshteinDistance(searchResultSet.objects[i].slug.split("-").reverse().join(" "),searchTerm))
            ,distance:levenshteinDistance(searchResultSet.objects[i].slug.split("-").join(" "),searchTerm)
            ,from:searchResultSet.objects[i].slug.split("-").join(" ")
            ,to:searchTerm
            ,inverted_distance:levenshteinDistance(searchResultSet.objects[i].slug.split("-").reverse().join(" "),searchTerm)
            ,jaro_winkler:jarowinklerDistance(searchResultSet.objects[i].slug.split("-").join(""),searchTerm)
            ,jaro_winkler_reverse:jarowinklerDistance(searchResultSet.objects[i].slug.split("-").reverse().join(""),searchTerm)
            ,segmented_distance:segmentedDistance(searchResultSet.objects[i].slug,searchTerm,"-")
            ,from:searchResultSet.objects[i].slug.split("-").join(" ")}); */



        }
        console.log(oVal);
        return oVal;
    }

    /**
     * Transformación de los resultados de búsqueda de una empresa a nodos de tipo busqueda de empresa
     * @param {*} inputArray
     * @param {*} rootNodeData
     */
    transformCompaniesSearchResultsTo(inputArray,rootNodeData,searchTerm){
        let oVal=[];
        let searchResultSet=new SearchResultSet(inputArray,NODE_TYPE_COMPANIES_SEARCH_RESULT)
        for(let i=0;i<searchResultSet.objects.length;i++){
            oVal.push({
                type:NODE_TYPE_COMPANIES_SEARCH_RESULT,
                key:"search-"+searchResultSet.objects[i].slug,
                resource_uri:searchResultSet.objects[i].resource_uri,
                search_term:searchTerm,
                expanded:false,
                accuracy:Math.max(jarowinklerDistance(searchResultSet.objects[i].slug.split("-").join(""),searchTerm.split(" ").join("")),jarowinklerDistance(searchResultSet.objects[i].slug.split("-").reverse().join(""),searchTerm.split(" ").join("")))
                //parent:rootNodeData===null?"":rootNodeData.key
            })
        }
        return oVal;
    }


    transformCompaniesTo(inputArray,rootNodeData){

    }





    /**
     *
     * @param {*} inputJson
     * @param {*} rootNodeData
     */
    transformCompanyTo(inputJson,rootNodeData){
        console.log({transformCompanyTo:{inputJson:inputJson,root:rootNodeData,rootParent:rootNodeData.parent}});
        let oVal=[];
        let rels=[];

        let myCompanyDetails=new CompanyDetail(inputJson);
            oVal.push({
                type:NODE_TYPE_COMPANY,
                key:myCompanyDetails.slug,
                slug:myCompanyDetails.slug,
                resource_uri:myCompanyDetails.resource_uri,
                name:myCompanyDetails.name,
                company:myCompanyDetails,
                expanded:true
                //parent:rootNodeData===null?"":(rootNodeData.parent!==""?rootNodeData.key:"")
            });



            for(let i=0;i<myCompanyDetails.cargos_actuales_c.length;i++){
                oVal.push({
                    type:NODE_TYPE_COMPANY_TITLE,
                    key:myCompanyDetails.cargos_actuales_c[i].title+":"+myCompanyDetails.cargos_actuales_c[i].name,
                    title:myCompanyDetails.cargos_actuales_c[i].title,
                    searchTerm:myCompanyDetails.cargos_actuales_c[i].name
                    //,parent:myCompanyDetails.slug
                });

            }


            for(let i=0;i<myCompanyDetails.cargos_actuales_p.length;i++){
                oVal.push({
                    type:NODE_TYPE_PERSON_TITLE,
                    //key:myCompanyDetails.cargos_actuales_p[i].title+":"+myCompanyDetails.cargos_actuales_p[i].name,
                    key:myCompanyDetails.cargos_actuales_p[i].name.toLowerCase().split(" ").join("-"),
                    title:myCompanyDetails.cargos_actuales_p[i].title,
                    searchTerm:myCompanyDetails.cargos_actuales_p[i].name
                    //,parent:myCompanyDetails.slug
                });
            }

            for(let i=0;i<myCompanyDetails.cargos_historial_c.length;i++){
                oVal.push({
                    type:NODE_TYPE_COMPANY_TITLE,
                    key:myCompanyDetails.cargos_historial_c[i].title+":"+myCompanyDetails.cargos_historial_c[i].name,
                    title:myCompanyDetails.cargos_historial_c[i].title,
                    active:false,
                    period:{date_from:myCompanyDetails.cargos_historial_c[i].date_from!==undefined?myCompanyDetails.cargos_historial_c[i].date_from:""
                    ,date_from:myCompanyDetails.cargos_historial_c[i].date_to!==undefined?myCompanyDetails.cargos_historial_c[i].date_to:""},
                    searchTerm:myCompanyDetails.cargos_historial_c[i].name,
                    labelLink:"label"
                    //,parent:myCompanyDetails.slug
                });
            }

            for(let i=0;i<myCompanyDetails.cargos_historial_p.length;i++){
                oVal.push({
                    type:NODE_TYPE_PERSON_TITLE,
                    key:myCompanyDetails.cargos_historial_p[i].title+":"+myCompanyDetails.cargos_historial_p[i].name,
                    title:myCompanyDetails.cargos_historial_p[i].title,
                    active:false,
                    period:{date_from:myCompanyDetails.cargos_historial_p[i].date_from!==undefined?myCompanyDetails.cargos_historial_p[i].date_from:""
                        ,date_from:myCompanyDetails.cargos_historial_p[i].date_to!==undefined?myCompanyDetails.cargos_historial_p[i].date_to:""},
                    searchTerm:myCompanyDetails.cargos_historial_p[i].name
                    //,parent:myCompanyDetails.slug
                });
            }



            // RELATIONS
            let filteredOval=[];
            filteredOval.push(oVal[0]);
            for(let i=1;i<oVal.length;i++){
                let node=oVal[i];
                let distance=jarowinklerDistance(node.searchTerm.toUpperCase(),rootNodeData.name.toUpperCase());
                console.log("SUSTITUCION DE NODO PADRE "+distance+" "+node.searchTerm+" Vs "+rootNodeData.name);
                if(distance===1){ // Exact Match
                    rels.push({from:oVal[0].key,to:rootNodeData.key,text:oVal[i].title
                        ,key:oVal[0].key+":"+node.key+":"+oVal[i].title.replace(".","")});
                }else{
                    rels.push({from:oVal[0].key,to:node.key,text:oVal[i].title
                        ,key:oVal[0].key+"_"+node.key+"_"+oVal[i].title.replace(".","")});
                    filteredOval.push(oVal[i]);
                }
            }
        return {nodes:filteredOval,relations:rels};
    }

    transformPersonsTo(inputArray,rootNodeData){

    }

    /**
     *
     * Método para transformar una persona de la api a un conjunto de nodos relacionados
     * @deprecated
     * @param {*} inputJson
     * @param {*} rootNodeData
     */
    transformPersonTo(inputJson,rootNodeData){
        console.log({transformPersonTo:inputJson,rootNodeData:rootNodeData});
        let oVal=[];

        let myPerson=new PersonDetail(inputJson);
            oVal.push({
                type:NODE_TYPE_PERSON,
                key:myPerson.slug,
                slug:myPerson.slug,
                resource_uri:myPerson.resource_uri,
                name:myPerson.name,
                person:myPerson,
                expanded:true,
                parent:rootNodeData===null?"":(rootNodeData.parent!==""?rootNodeData.parent:"")
            });


            for(let i=0;i<myPerson.cargos_actuales.length;i++){
                oVal.push({
                    type:NODE_TYPE_COMPANY_TITLE,
                    key:myPerson.cargos_actuales[i].title+":"+myPerson.cargos_actuales[i].name,
                    title:myPerson.cargos_actuales[i].title,
                    parent:myPerson.slug,
                    active:true,
                    searchTerm:myPerson.cargos_actuales[i].name,
                    parent:myPerson.slug
                });
            }
        return oVal;
    }

     /**
     * Método para transformar una persona de la api a un conjunto de nodos relacionados
     * @param {*} inputJson
     * @param {*} rootNodeData
     */
    async transformPersonToNetwork(inputJson,rootNodeData){
        console.log({transformPersonToNetwork:{input:inputJson,rootNodeData:rootNodeData}});
        let oVal=[];
        let relations=[];

        let myPerson=new PersonDetail(inputJson);
        let rootNode={
            type:NODE_TYPE_PERSON,
            key:myPerson.slug,
            slug:myPerson.slug,
            resource_uri:myPerson.resource_uri,
            name:myPerson.name,
            person:myPerson,
            expanded:true
            //parent:rootNodeData===null?"":(rootNodeData.parent!==""?rootNodeData.parent:"")
        };
         //   oVal.push(rootNode);
            this.eventsTarget.dispatchEvent(new CustomEvent('addNodeToNetwork', {
                detail: { node: rootNode },
                bubbles: true,
                composed: true }));



            for(let i=0;i<myPerson.cargos_actuales.length;i++){

              await BormeClient.searchEmpresa("http://localhost:8080",myPerson.cargos_actuales[i].name).then(sleeper(Math.floor(Math.random() * 1000) + 1)).then(myJson=>{
                    let searchResults=this.transformCompaniesSearchResultsTo(myJson,rootNode,myPerson.cargos_actuales[i].name);
                    searchResults.forEach(async node=>{

                        if(node.accuracy>=0.75){
                            this.eventsTarget.dispatchEvent(new CustomEvent('LoadEmpresa',{
                            detail:{node:node},
                            bubbles:true,
                            composed:true
                        }));
                                await BormeClient.loadEmpresa("http://localhost:8080",node.resource_uri).then(
                                    data=>{
                                        let companyMesh=this.transformCompanyTo(data,rootNode);
                                        this.eventsTarget.dispatchEvent(new CustomEvent('addNodeToNetwork', {
                                            detail: { nodes: companyMesh.nodes,relations:companyMesh.relations},
                                            bubbles: true,
                                            composed: true }));
                                    }
                                );

                            }else{
                            console.log({NODO_DESCARTADO:node});
                        }
                    });
                });

            }
        return oVal;
    }
}





