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
    let parentNode=CypherProcessor.simpleCypherNode(parentLabel,parentProps);
    let childNode=CypherProcessor.simpleCypherNode(childLabel,childProps);
    let relation=CypherProcessor.simpleCypherRelation(relVariable,relLabel,relProps,"->");
    return `${parentNode}${relation}${childNode}`;
}

   static cypherTree(nodeArray){
       for(let i=0;i<nodeArray.length;i++){
            let currentNode=nodeArray[i];
            let parentNode=(i>0?nodeArray[i-1]:null);
            CypherProcessor.simpleCypherChildNodeRelation(parentNode!==null?parentNode.type:"",parentNode,"relatesTo",{},currentNode.type,currentNode);
       }
   }
}


class Cnode{
   static cypher(variable,label,properties){
        return `(${variable}:${label}{${templateLiteralParser(properties)}})`;
    }

   static simpleCypher(label,properties){
    return `(${label}{${templateLiteralParser(properties)}})`;
   }
}

class Rel{
    static cypher(variable,label,properties,direction){
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
            return `<-[${label}{${templateLiteralParser(properties)}}]-`;
        }

        if(direction==="->"){
            return `-[${label}{${templateLiteralParser(properties)}}]->`;
        }

        if(direction==="<-->"){
            return `<-[${label}{${templateLiteralParser(properties)}}]->`;
        }
     }
 }


function templateLiteralParser(object){
    let oVal=``;
    Object.getOwnPropertyNames(object).forEach((propName)=>{
        oVal+=`${propName}:"${object[propName]}",`;
    });
    oVal.slice(0,oVal.length-1);
    return oVal;
}