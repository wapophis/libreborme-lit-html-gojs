export class GojsModelManager{
    static getFlatTree(diagram,dataNode){
        let oVal=[];
        let rootNode=diagram.findNodeForKey(dataNode.key);
        let it=rootNode.findTreeChildrenNodes();

        while(it.next()){
          let node=it.value;
          oVal.push(node.data);
        };

        for(let i=0;i<oVal.length && i<it.count;i++){
        //  console.log({index:i,rootNode:dataNode,processing_plane:oVal[i],length:oVal.length});
          Array.prototype.push.apply(oVal, GojsModelManager.getFlatTree(diagram,oVal[i]));
        }

       // console.log({dataNode:dataNode,oVal:oVal});
        return oVal;
    }
}