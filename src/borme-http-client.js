import { SearchResult,SearchResultSet, CompanyDetail, PersonDetail, Cargo } from "./borme-adapter";
import { NODE_TYPE_COMPANIES_SEARCH_RESULT } from "./node-adapter";


export class BormeClient{

  static async searchEmpresa(baseUri,empresa){
    var myHeaders = new Headers();
    let response=await fetch(baseUri+'/borme/api/v1/'+'empresa'+'/search/?q='+empresa+'&page=1',
    {
    method:'GET',
    mode: 'cors',
    redirect:'follow',
    headers: myHeaders
    });
    let data = await response.json()
    return data;
  }

  static async searchPersona(baseUri,persona){
    var myHeaders = new Headers();
    let response=await fetch(baseUri+'/borme/api/v1/'+'persona'+'/search/?q='+persona+'&page=1',
    {
    method:'GET',
    mode: 'cors',
    redirect:'follow',
    headers: myHeaders
    });
    let data = await response.json()
    return data;
  }

  static async loadEmpresa(baseUri,uri){
    var myHeaders = new Headers();
    let response=await fetch(baseUri+uri,
    {
    method:'GET',
    mode: 'cors',
    redirect:'follow',
    headers: myHeaders
    });
    let data = await response.json()
    return data;
  }


  static async loadPersona(baseUri,uri){
    var myHeaders = new Headers();
    let response=await fetch(baseUri+uri,
    {
    method:'GET',
    mode: 'cors',
    redirect:'follow',
    headers: myHeaders
    });
    let data = await response.json()
    return data;
  }


  static async loadPersonaByUri(baseUri,uri,autoexpand,accuracy,callback){
    BormeClient.loadPersona(baseUri,uri).then(data=>{
      let persona=new PersonDetail(data);
      let myAccuracy=0;
      if(accuracy!==undefined && accuracy!==null){
        myAccuracy=accuracy;
      }
      if(autoexpand===true){
        persona.cargos_actuales.forEach(element=>{
          BormeClient.searchEmpresa(baseUri,element.name).then(data=>{
            let searchResults=new SearchResultSet(data,"empresa",element.name);
            searchResults.objects.forEach(result=>{
              if(result.accuracy>=accuracy){
                BormeClient.loadEmpresa(baseUri,result.resource_uri).then((data)=>{        
                  callback(persona,new CompanyDetail(data),new Cargo(element));
                  }
                );
              }
            });
          });
        });

        persona.cargos_historial.forEach(element=>{
          BormeClient.searchEmpresa(baseUri,element.name).then(data=>{
            let searchResults=new SearchResultSet(data,"empresa",element.name);
            searchResults.objects.forEach(result=>{
              if(result.accuracy>=accuracy){
                BormeClient.loadEmpresa(baseUri,result.resource_uri).then((data)=>{        
                  callback(persona,new CompanyDetail(data),new Cargo(element));
                  }
                );
              }
            });
          });
        });
      }
    });
  }

  static async loadEmpresaByUri(baseUri,uri,autoexpand,accuracy,callback){
    BormeClient.loadEmpresa(baseUri,uri).then(data=>{
      let company=new CompanyDetail(data);
      let myAccuracy=0;
      if(accuracy!==undefined && accuracy!==null){
        myAccuracy=accuracy;
      }
      if(autoexpand===true){
        company.cargos_actuales_c.forEach(element => {
            BormeClient.searchEmpresa(baseUri,element.name).then(data=>{
              let searchResults=new SearchResultSet(data,"empresa",element.name);
              searchResults.objects.forEach(result=>{
                  if(result.accuracy>=accuracy){
                    BormeClient.loadEmpresa(baseUri,result.resource_uri).then((data)=>{
                      callback(company,new CompanyDetail(data),new Cargo(element));
                    }
                    );
                  }
              });
            });
      });

        company.cargos_historial_c.forEach(element => {
          BormeClient.searchEmpresa(baseUri,element.name).then(data=>{
            let searchResults=new SearchResultSet(data,"empresa",element.name);
            searchResults.objects.forEach(result=>{
                if(result.accuracy>=accuracy){
                  BormeClient.loadEmpresa(baseUri,result.resource_uri).then((data)=>{
                    callback(company,new CompanyDetail(data),new Cargo(element));
                  }
                  );
                }
            });
          });
      });

      company.cargos_actuales_p.forEach(element => {
        BormeClient.searchPersona(baseUri,element.name).then(data=>{
          let searchResults=new SearchResultSet(data,"persona",element.name);
          searchResults.objects.forEach(result=>{
              if(result.accuracy>=accuracy){
                BormeClient.loadPersona(baseUri,result.resource_uri).then((data)=>{
                  callback(company,new PersonDetail(data),new Cargo(element));
                }
                );
              }
          });
        });
      });

      company.cargos_historial_p.forEach(element => {
        BormeClient.searchPersona(baseUri,element.name).then(data=>{
          let searchResults=new SearchResultSet(data,"persona",element.name);
          searchResults.objects.forEach(result=>{
              if(result.accuracy>=accuracy){
                BormeClient.loadPersona(baseUri,result.resource_uri).then((data)=>{
                  callback(company,new PersonDetail(data),new Cargo(element));
                  }
                  );
                }
            });
          });
        });
      }
    });

  }


  /**
   * Carga una empresa facilitando un nombre para la misma, en caso de especificar autoload, los resultados
   * con un valor de acierto superior o igual a accuray serán cargados de forma progresiva. Se llamará
   * el callback cada vez que se produzca la carga de un resultado de búsqueda
   * @param {} baseUri 
   * @param {*} searchName 
   * @param {*} autoexpand 
   * @param {*} accuracy 
   * @param {*} callback
   */
  static loadEmpresaByName(baseUri,searchName,autoexpand,accuracy,callback){
    BormeClient.searchEmpresa(baseUri,searchName).then(data=>{
      let results=new SearchResultSet(data,NODE_TYPE_COMPANIES_SEARCH_RESULT,searchName);
      if(autoexpand===true){
        if(accuracy===undefined || accuracy===null){
          accuracy=0;
        }
        for(let i=0;i<results.objects.length;i++){
          if(results.objects[i].accuracy>=accuracy){
            BormeClient.loadEmpresa(baseUri,results.objects[i].resource_uri).then(data=>{
              callback(data);
            })
           }
        }
      
      }
    });
  };


}