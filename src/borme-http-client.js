export class BormeClient{

  static async searchEmpresa(baseUri,empresa){
    var myHeaders = new Headers();
    let response=await fetch("http://localhost:8080"+'/borme/api/v1/'+'empresa'+'/search/?q='+empresa+'&page=1',
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