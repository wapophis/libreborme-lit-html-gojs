export class CypherProcessor{
   static cypherNode(variable,label,node){
        return Cnode.cypher(variable,label,node);
    }

   static cypherRelation(variable,label,properties,direction){
       return Rel.cypher(variable,label,properties,direction);
   }

   static cypherChildNodeRelation(parentVariable,parentLabel,parentProps,relVariable,relLabel,relProps,childVariable,childLabel,childProps){
       let parentNode=CypherProcessor.cypherNode(parentVariable,parentLabel,parentProps);
       let childNode=CypherProcessor.cypherNode(childVariable,childLabel,childProps);
       let relation=CypherProcessor.cypherRelation(relVariable,relLabel,relProps,"->");
       return `${parentNode}${relation}${childNode}`;
   }
}


class Cnode{
   static cypher(variable,label,properties){
        return `(${variable}:${label}{${templateLiteralParser(properties)}})`;
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
 }


function templateLiteralParser(object){
    let oVal=``;
    Object.getOwnPropertyNames(object).forEach((propName)=>{
        oVal+=`${propName}:"${object[propName]}",`;
    });
    oVal.slice(0,oVal.length-1);
    return oVal;
}