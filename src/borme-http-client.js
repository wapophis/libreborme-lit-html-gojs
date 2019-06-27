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


}