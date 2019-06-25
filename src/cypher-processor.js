/**
 * This is a cypher processor for a flat tree expressed as an array of nodes coming from gojs format.
 */

export class CypherProcessor{
   static cypherNode(variable,label,node){
        return Cnode.cypher(variable,label,node);
    }

    static simpleCypherNode(label,node){
        return Cnode.simpleCypher(label,node);
    }

   static cypherRelation(variable,label,properties,direction){
       return Rel.cypher(variable,label,properties,direction);
   }

   static simpleCypherRelation(label,properties,direction){
    return Rel.simpleCypher(label,properties,direction);
}

   static cypherChildNodeRelation(parentVariable,parentLabel,parentProps,relVariable,relLabel,relProps,childVariable,childLabel,childProps){
       let parentNode=CypherProcessor.cypherNode(parentVariable,parentLabel,parentProps);
       let childNode=CypherProcessor.cypherNode(childVariable,childLabel,childProps);
       let relation=CypherProcessor.cypherRelation(relVariable,relLabel,relProps,"->");
       return `${parentNode}${relation}${childNode}`;
   }

   static simpleCypherChildNodeRelation(parentLabel,parentProps,relLabel,relProps,childLabel,childProps){
    let rootNodeIsPresent=parentLabel!==null?true:false;

    let parentNode=rootNodeIsPresent?CypherProcessor.simpleCypherNode(parentLabel,parentProps):"";
    let childNode=CypherProcessor.simpleCypherNode(childLabel,childProps);
    let relation=rootNodeIsPresent?CypherProcessor.simpleCypherRelation(relLabel,relProps,"->"):"";
    console.log(`${parentNode}${relation}${childNode}`);
    return `${parentNode}${relation}${childNode}`;
}


    /**
     * Cypher a tree expressed as a node array with parent-child relationships.
     * @param {*} nodeArray 
     * @param {Function} relationshipParseFunction Function to parse relations, must return an object in cypher format like {var:variable,label:label,props:properties,direction:->|<-|-><-}
     * @param {String} processedPropertyKey String with the property key wich control if node has been cyphered.
     */
   static cypherTree(nodeArray,relationshipParseFunction,processedPropertyKey){
       let oVal=[];
       for(let i=0;i<nodeArray.length;i++){
            let currentNode=nodeArray[i];
            let isRootNode=(i===0);
            let childs=CypherProcessor._lookForChildrens(nodeArray.slice(i+1,nodeArray.length),"parent",currentNode.key);
            console.log({rootNode:currentNode,childs:childs});
            let hasChilds=(childs.length>0);
            let cypheredChilds=[];
            let cypheredRel=null;

            if(currentNode[processedPropertyKey]===false || currentNode[processedPropertyKey]===undefined){
                oVal.push(',');
                oVal.push(CypherProcessor.cypherNode("node_"+currentNode.__gohashid,currentNode.type.replace("-","_"),currentNode));
                currentNode[processedPropertyKey]=true;
            }

            for(let j=0;hasChilds && j<childs.length;j++){
                oVal.push(',');
                oVal.push(CypherProcessor.cypherNode("node_"+currentNode.__gohashid));
                cypheredRel= relationshipParseFunction(currentNode,childs[j]);
                oVal.push(CypherProcessor.cypherRelation(cypheredRel.var,cypheredRel.label,cypheredRel.props,cypheredRel.direction));
                oVal.push(CypherProcessor.cypherNode("node_"+childs[j].__gohashid,childs[j].type.replace("-","_"),childs[j]));
                childs[j][processedPropertyKey]=true;
            }

            console.log(oVal);
       }

       for(let i=0;i<nodeArray.length;i++){
           nodeArray[i][processedPropertyKey]=false;
       }
    return oVal;
    }

 

    static _lookForChildrens(nodeArray,propParentKey,parentValue){
        let oVal=[];
        for(let i=0;i<nodeArray.length;i++){
            if(nodeArray[i].parent!==undefined && nodeArray[i].parent!==null && nodeArray[i].parent!==""){
                if((nodeArray[i])[propParentKey]===parentValue){
                        oVal.push(nodeArray[i]);
                }
            }
        }
        return oVal;
    }
}


class Cnode{
   static cypher(variable,label,properties){
       if((label===undefined || label===null) && (properties===undefined || properties===null)){
            if(variable===undefined || variable===null){
                throw Error("Cannot parse without variable");
            }
        return `(${variable})`;
       }

       if((label===undefined || label===null)){
           if(variable===undefined || variable===null){
               throw Error("Cannot parse without variable");
           }
        return `(${variable}{${templateLiteralParser(properties)}})`;
        }

        if(variable===undefined || variable===null){
            return `(${label}{${templateLiteralParser(properties)}})`;
        }
        return `(${variable}:${label}{${templateLiteralParser(properties)}})`;
    }

   static simpleCypher(label,properties){
    return `(${label}{${templateLiteralParser(properties)}})`;
   }
}

class Rel{
    static cypher(variable,label,properties,direction){
        if(properties===undefined || properties===null){
            properties={};
        }

        if(variable===undefined || variable===null){
            return Rel.simpleCypher(label,properties,direction);
        }

        if(direction==="<-"){
            return `<-[${variable}:${label}{${templateLiteralParser(properties)}}]-`;
        }

        if(direction==="->"){
            return `-[${variable}:${label}{${templateLiteralParser(properties)}}]->`;
        }

        if(direction==="<-->"){
            return `<-[${variable}:${label}{${templateLiteralParser(properties)}}]->`;
        }
     }

     static simpleCypher(label,properties,direction){
        if(direction==="<-"){
            return `<-[:${label}{${templateLiteralParser(properties)}}]-`;
        }

        if(direction==="->"){
            return `-[:${label}{${templateLiteralParser(properties)}}]->`;
        }

        if(direction==="<-->"){
            return `<-[:${label}{${templateLiteralParser(properties)}}]->`;
        }

        return '--';
     }
 }


function templateLiteralParser(object){
    let oVal=``;
    Object.getOwnPropertyNames(object).forEach((propName)=>{
        oVal+=`${propName}:'${object[propName]}',`;
    });
    return oVal.slice(0,oVal.length-1);
}