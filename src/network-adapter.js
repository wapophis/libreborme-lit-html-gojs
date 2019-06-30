import { CompanyDetail, Cargo } from "./borme-adapter";

export class GraphNetwork{

    constructor(){
        this.relationMap=new Map();
        this.nodesMap=new Map();
    }

    addNodeData(input){
        let node=new Node(input);
        this.nodesMap.set(_buildNodeKey(input),input);
    }

    _buildNodeKey(input){
        return input.variable+":"+input.key,input;
    }




    /**
     * Devuelve una empresa con todas sus relaciones.
     * @param {*} companyDetailData 
     */
    /*static processEmpresa(companyDetailData){
        let myCompany=new CompanyDetail(companyDetailData);
        let nodes=[];
        let relations=[];
        myCompany.cargos_actuales_c.forEach(cargo=>{
            let mycargo=new Cargo(cargo);
            nodes.push(new Node({variable:cargo.name.split("")
                ,label:
                ,properties:
                ,key:
            }))
        });
        myCompany.cargos_actuales_p.forEach(cargo=>{
            let mycargo=new Cargo(cargo);
        });
        myCompany.cargos_historial_c.forEach(cargo=>{
            let mycargo=new Cargo(cargo);
        });
        myCompany.cargos_historial_p.forEach(cargo=>{
            let mycargo=new Cargo(cargo);
        });
    }*/
}


/**
 * 
 */
export class Node{
    constructor(object){
        this._validate(object);
        this.variable=object.variable;
        this.label=object.label;
        this.properties=object.properties;
        this.key=object.key;
    }

    _clone(object){
        Object.getOwnPropertyNames(object).forEach(propName=>{
            this[propName]=object[propName];
        });
    }

    _validate(object){
        if(!Object.getOwnPropertyNames(object).includes('label')){
            throw Error("Object input must have a label field");
        }
        if(!Object.getOwnPropertyNames(object).includes('properties')){
            throw Error("Object input must have a properties field object");
        }
        if(!Object.getOwnPropertyNames(object.properties).includes('key')){
            throw Error("Object properties input must have a key field");
        }
    }
}

export class Relation{

}