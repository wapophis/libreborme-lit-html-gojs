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


}





