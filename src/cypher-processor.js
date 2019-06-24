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

   static cypherTree(nodeArray){
       let oVal=[];
       for(let i=0;i<nodeArray.length;i++){
            let currentNode=nodeArray[i];
            let currentRel=i>0?{label:"relatesTo",direction:"->"}:null;

            if(currentRel!==null){
                oVal.push(CypherProcessor.simpleCypherRelation(currentRel.label,{},currentRel.direction));
            }

            let childs=this._lookForChildrens(nodeArray.slice(i+1,nodeArray.length));
            if(childs.length>1){
                childs.forEach((child)=>{
                    oVal.push(CypherProcessor.simpleCypherNode(currentNode.type,currentNode));
                });
            }else{
            oVal.push(CypherProcessor.simpleCypherNode(currentNode.type,currentNode));
            }

            console.log(oVal);
       }
    return oVal;
    }

    _lookForChildrens(nodeArray,propParentKey,parentValue){
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