import { CompanyDetail, Cargo, PersonDetail } from "./borme-adapter";

/**
 * Representación de una red basada en grafo
 */
export class GraphNetwork{

    constructor(){
        this.relationMap=new Map();
        this.nodesMap=new Map();
    }

    addNodeData(input){
        this.nodesMap.set(this._buildNodeKey(input),input);
        return input;
    }

    nodeDataExists(data){
        return this.nodesMap.has(this._buildNodeKey(data));
    }

    _buildNodeKey(input){
        return (input.variable!==undefined?input.variable:"")+":"+input.label;
    }

    _buildRelationKey(relation){
        return relation.variable;
    }

    addRelation(relation){
        this.relationMap.set(this._buildRelationKey(relation),relation);
        return relation;
    }
}


/**
 * Representación de un nodo
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
        if(!Object.getOwnPropertyNames(object).includes('key')){
            throw Error("Object input must have a key field");
        }
    }
}

/**
 * Representación de una relación
 */
export class Relation{
    constructor(from,to,direction,label,properties){
        this._validate(from,to,direction);
        this.variable=from.variable+":"+direction+":"+to.variable;
        this.key=from.key+":"+to.key;
        this.direction=direction;
        this.label=label;
        this.properties=properties;
        this.from=from;
        this.to=to;
    }


    _validate(from,to,direction){
        if(! from instanceof Node){
            throw new Error("From object must be a node");
        }
        if(! to instanceof Node){
            throw new Error("To object must be a node");
        }

        if(direction!=="->" && direction!=="<-" && direction!=="<-->")
        {
            throw new Error ("Uknown direction type")
        }

    }

}



/**
 * Network adapter for borme entities
 */
export class BormeGraphNetwork extends GraphNetwork{
    constructor(){
        super();
    }

    addNodeData(input){
        return super.addNodeData(this._parseToNode(input));        
    }

    _parseToNode(input){
        let label;
        if(input instanceof PersonDetail){
            label="Person"
        }

        if(input instanceof CompanyDetail){
            label="Company"
        }

        let node=new Node({
            variable:input.slug.split("-").join(""),
            label:label,
            properties:input,
            key:input.slug
        });
        return node;
    }

    addRelation(from,to,properties){
        let fromNode=this._parseToNode(from);
        let toNode=this._parseToNode(to);

        if(!super.nodeDataExists(fromNode)){
            super.addNodeData(fromNode);
        }
        if(!super.nodeDataExists(toNode)){
            super.addNodeData(toNode);
        }
        
        let rel=super.addRelation(this._parseRelation(fromNode,toNode,"->",properties.title,properties));
        rel.key=this._buildRelationKey(rel);
        return rel;

    }

    _parseRelation(from,to,direction,label,properties){
        let fromData=from.properties;
        let toData=to.properties;
        return new Relation(from,to,direction,label,properties);
    }

    _buildRelationKey(relation){
        return relation.variable+":"+relation.properties.title;
    }
    
}


/**
 * Representación de un grafo para cypher.
 */
export class CypherGraphNetwork extends GraphNetwork{
    constructor(){
        super();
    }



}