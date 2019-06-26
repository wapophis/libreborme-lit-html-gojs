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
                accuracy:Math.max(jarowinklerDistance(searchResultSet.objects[i].slug.split("-").join(""),searchTerm.split(" ").join("")),jarowinklerDistance(searchResultSet.objects[i].slug.split("-").reverse().join(""),searchTerm.split(" ").join(""))),
                parent:rootNodeData===null?"":rootNodeData.key
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
        let oVal=[];
        let myCompanyDetails=new CompanyDetail(inputJson);
            oVal.push({
                type:NODE_TYPE_COMPANY,
                key:myCompanyDetails.slug,
                slug:myCompanyDetails.slug,
                resource_uri:myCompanyDetails.resource_uri,
                name:myCompanyDetails.name,
                company:myCompanyDetails,
                expanded:true,
                parent:rootNodeData===null?"":(rootNodeData.parent!==""?rootNodeData.parent:"")
            });
            console.log(myCompanyDetails);

            for(let i=0;i<myCompanyDetails.cargos_actuales_c.length;i++){
                oVal.push({
                    type:NODE_TYPE_COMPANY_TITLE,
                    key:myCompanyDetails.cargos_actuales_c[i].title+":"+myCompanyDetails.cargos_actuales_c[i].name,
                    title:myCompanyDetails.cargos_actuales_c[i].title,
                    searchTerm:myCompanyDetails.cargos_actuales_c[i].name,
                    parent:myCompanyDetails.slug
                });
            }

            for(let i=0;i<myCompanyDetails.cargos_actuales_p.length;i++){
                oVal.push({
                    type:NODE_TYPE_PERSON_TITLE,
                    key:myCompanyDetails.cargos_actuales_p[i].title+":"+myCompanyDetails.cargos_actuales_p[i].name,
                    title:myCompanyDetails.cargos_actuales_p[i].title,
                    searchTerm:myCompanyDetails.cargos_actuales_p[i].name,
                    parent:myCompanyDetails.slug
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
                    labelLink:"label",
                    parent:myCompanyDetails.slug
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
                    searchTerm:myCompanyDetails.cargos_historial_p[i].name,
                    parent:myCompanyDetails.slug
                });
            }

            console.log(oVal);
        return oVal;

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
        console.log({transformPersonTo:inputJson,rootNodeData:rootNodeData});
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
            expanded:true,
            parent:rootNodeData===null?"":(rootNodeData.parent!==""?rootNodeData.parent:"")
        };
         //   oVal.push(rootNode);
            this.eventsTarget.dispatchEvent(new CustomEvent('addNodeToNetwork', {
                detail: { node: rootNode },
                bubbles: true,
                composed: true }));



            for(let i=0;i<myPerson.cargos_actuales.length;i++){
              await BormeClient.searchEmpresa("http://localhost",myPerson.cargos_actuales[i].name).then(sleeper(1000)).then(myJson=>{
                    let searchResults=this.transformCompaniesSearchResultsTo(myJson,rootNode,myPerson.cargos_actuales[i].name);
                    searchResults.forEach(async node=>{
                        if(node.accuracy>=0.75){
                                await BormeClient.loadEmpresa("http://localhost",node.resource_uri).then(
                                    data=>{
                                        console.log({data_in_promise:data,node:this.transformCompanyTo(data,rootNode)});
                                        this.eventsTarget.dispatchEvent(new CustomEvent('addNodeToNetwork', {
                                            detail: { nodes: this.transformCompanyTo(data,rootNode) },
                                            bubbles: true,
                                            composed: true }));
                                       // Array.prototype.push.apply(oVal,this.transformCompanyTo(data,rootNode));
                                    }
                                );
                               // oVal.push(node);
                        }else{
                            console.log({NODO_DESCARTADO:node});
                        }
                    });
                    //Array.prototype.push.apply(oVal,this.transformCompaniesSearchResultsTo(myJson,rootNode,myPerson.cargos_actuales[i].name));
                });
              /*  oVal.push({
                    type:NODE_TYPE_COMPANIES_SEARCH_RESULT,
                    key:myPerson.cargos_actuales[i].title+":"+myPerson.cargos_actuales[i].name,
                    title:myPerson.cargos_actuales[i].title,
                    parent:myPerson.slug,
                    active:true,
                    searchTerm:myPerson.cargos_actuales[i].name,
                    parent:myPerson.slug
                });*/
            }
            console.log({transformPersonToNetwork:oVal});
        return oVal;
    }
}





