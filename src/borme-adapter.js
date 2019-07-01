/**
 * Adaptador para la información devuelta por el libre borme.
 */

import {levenshteinDistance,damerauLevensteing, segmentedDistance, jarowinklerDistance} from './utils';


export class PersonDetail{
    constructor(inputJson){
        this.cargos_actuales=inputJson.cargos_actuales;
        this.cargos_historial=inputJson.cargos_historial;
        this.date_updated=inputJson.date_updated;
        this.in_bormes=inputJson.in_bormes;
        this.in_companies=inputJson.in_companies;
        this.name=inputJson.name;
        this.resource_uri=inputJson.resource_uri;
        this.slug=inputJson.slug;

       for(let i=0;i<this.in_companies.length;i++){
            this.in_companies[i]=this.in_companies[i].toUpperCase();
       }
        
    }

   
}

export class CompanyDetail{
    constructor(inputJson){
        this.cargos_actuales_c=inputJson.cargos_actuales_c;
        this.cargos_actuales_p=inputJson.cargos_actuales_p;
        this.cargos_historial_c=inputJson.cargos_historial_c;
        this.cargos_historial_p=inputJson.cargos_historial_p;
        this.date_creation=inputJson.date_creation;
        this.date_extinction=inputJson.date_extinction;
        this.date_updated=inputJson.date_updated;
        this.in_bormes=inputJson.in_bormes;
        this.is_active=inputJson.is_active;
        this.name=inputJson.name;
        this.slug=inputJson.slug;
        this.resource_uri=inputJson.resource_uri;
        this.type=inputJson.type;
        this.in_companies=[];

        for(let i=0;i<this.cargos_actuales_c.length;i++){
            this.cargos_actuales_c[i].name=this.cargos_actuales_c[i].name.toUpperCase();
            this.in_companies.push(this.cargos_actuales_c[i].name);
        }
        for(let i=0;i<this.cargos_historial_c.length;i++){
            this.cargos_historial_c[i].name=this.cargos_historial_c[i].name.toUpperCase();
            this.in_companies.push(this.cargos_historial_c[i].name);
        }
    }
    
}

export class SearchResult{

    constructor(jsonInput,searchType,searchTerm){
        this.name=jsonInput.name;
        this.resource_uri=jsonInput.resource_uri;
        this.slug=jsonInput.slug;
        this.searchType=searchType;
        this.searchTerm=searchTerm;
        try{
        this.accuracy=Math.max(jarowinklerDistance(this.slug.split("-").join("").toUpperCase(),this.searchTerm.split(" ").join("").toUpperCase()),jarowinklerDistance(this.slug.split("-").reverse().join("").toUpperCase(),this.searchTerm.split(" ").join("").toUpperCase()));
        }catch(e){
            this.accuracy=0;
        }

        console.log({SearchResult:this});

    }

}


export class SearchResultSet {
    constructor(jsonInput,searchType,searchTerm){
        this.searchType=searchType;
        this.searchTerm=searchTerm;
        this.objects=jsonInput.objects;

    }

    get objects(){
        if(this.myObjects===undefined){
            this.myObjects=[];
        }

        return this.myObjects;
    }


    set objects(inputArray){
        for(let i=0;i<inputArray.length;i++){
            this.objects.push(new SearchResult(inputArray[i],this.searchType,this.searchTerm));
        }
    }
    
}


export class Cargo{
    constructor(jsonInput){
        this.date_from=jsonInput.date_from;
        this.title=jsonInput.title;
        this.date_to=jsonInput.date_to;
        this.name=jsonInput.name;
    }

    get isPasive(){
        if(date_to!==undefined || date_to!==null){
            let date=new Date(date_to);
            return date.getTime<=new Date();
        }
        return false;
    }
}

function _clone(object,dest){
    
    Object.getOwnPropertyNames(object).forEach(propName=>{
        dest[propName]=object[propName];
    });
    
}
