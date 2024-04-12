const express = require('express')
const path = require('path')
const sql = require('mssql')
const PORT = process.env.PORT || 5000
const http = require('http')
const bodyParser = require('body-parser');
const rtfToHTML = require('@iarna/rtf-to-html')

var jsonParser = bodyParser.json()
var config = {
  user: "alberto",
  password: "admin",
  server: "localhost",
  database: "FreshTropical",
  port: 1433,
  options: {
    encrypt: false,
    useUTC: true,
  },

  pool: {
    max: 100,
    min: 0,
    idleTimeoutMillis: 3600000,
  },
};
var connection = new sql.ConnectionPool(config);
String.prototype.replaceAll = function (stringToFind, stringToReplace) {
  if (stringToFind === stringToReplace) return this;
  var temp = this;
  var index = temp.indexOf(stringToFind);
  while (index != -1) {
      temp = temp.replace(stringToFind, stringToReplace);
      index = temp.indexOf(stringToFind,index+2);
  }
  return temp;
};
connection
  .connect()
//   .then(async function () {
//     console.log("connected");
//     connection.query("SELECT * FROM DATA", function (err, result, fields) {
//         if (err) throw err;
//         console.log(result);
//       });

//   })
//   .catch((err) => {
//     console.log(err);
//   });

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => {
    
    connection.query("SELECT * FROM DATA", (err, rows, fields) => {
        if(err){
          
        }else{
          res.render('pages/index',{data:rows.recordset});
        }
    })
   })
  .get('/allergeni', (req, res) => {
    
    connection.query("SELECT * FROM ALLERGENI", (err, rows, fields) => {
        if(err){
          
        }else{
          res.render('pages/allergeni',{allergeni:rows.recordset});
        }
    })
  })
  .get('/api/articoli',async (request, response) => {
    try{
      const data = await getData(request.query.codice);
      response.set('Access-Control-Allow-Origin', '*');
      response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.set('Access-Control-Allow-Headers', '*');
      response.set('Access-Control-Allow-Credentials', true);
      rtfToHTML.fromString(data.recordset[0].Ingredienti_Allergeni, (err, html) => {
        // prints a document containing:
        // <p><strong>hi there</strong></p>
      })
      response.send(data.recordset);
    }
    catch(error){
      console.log(error)
      response.send("Cannot send request");
    }
  })
  .post('/api/articoli',jsonParser,async (request, response) => {
    try{
        let body = request.body;
      if (!body.codice || body.codice == '')
        {
            response.send("{\"error\":\"invalid request\"}");
            return;
        }
      
      response.send(saveData(request.body));
    }
    catch(error){
      console.log(error)
      response.send("Cannot send request");
    }
  })
  
  .get('/api/allergeni',async (request, response) => {
    try{
      const data = await getAllergeni(request.query.lingua);
      response.set('Access-Control-Allow-Origin', '*');
      response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.set('Access-Control-Allow-Headers', '*');
      response.set('Access-Control-Allow-Credentials', true);
      response.send(data.recordset);
    }
    catch(error){
      console.log(error)
      response.send("Cannot send request");
    }
  })
  .post('/api/allergeni',jsonParser,async (request, response) => {
    try{
        let body = request.body;
      if (!body.lingua || body.lingua == '')
        {
            response.send("{\"error\":\"invalid request\"}");
            return;
        }
      
      response.send(saveAllergene(request.body));
    }
    catch(error){
      console.log(error)
      response.send("Cannot send request");
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

  async function getData(codice){
    ss = "";
    if (codice )
        ss = `SELECT * FROM DATA WHERE codice = '${codice}'`
    else
        ss  = "SELECT * FROM DATA";
    return await connection.query(ss);
  }
  async function getAllergeni(codice){
    ss = "";
    if (codice )
        ss = `SELECT * FROM ALLERGENI WHERE lingua = '${codice}'`
    else
        ss  = "SELECT * FROM ALLERGENI";
    return await connection.query(ss);
  }

function containsLike(arr,str){
  count = 0
  returning = []
  for (indd = 0;indd<arr.length;indd++)
  {
    elem = arr[indd];
    if (elem.trim().indexOf(str.trim())>=0)
      returning.push(elem.trim())
    count += 1
  }
  return returning
}
function mettiInGrassetto(stringa,allergene,inizioAllergene){
    newAllergene = '{\\b\\ul '+allergene +'}'
    newstr = stringa.substr(0,inizioAllergene) + newAllergene + stringa.substr(fineAllergene)
    return newstr
}
function ricalcolaAllergeni(ingredienti,ALLERGENI,EXCEPTIONS){
    for (indice = 0;indice<ALLERGENI.length;indice++){
      allergene = ALLERGENI[indice];
      
      inizioAllergene = ingredienti.toLowerCase().indexOf(allergene.toLowerCase());
      console.log(inizioAllergene);
      fineAllergene = inizioAllergene + allergene.length;
      if (inizioAllergene<0)
          continue;
      eccezioni = containsLike(EXCEPTIONS,allergene);
      
      if (eccezioni.length>0){
        racconta = 0;
        for (indu = 0;indu<eccezioni.length;indu++){
          eccezione = eccezioni[indu];
          inizioEccezione = ingredienti.toLowerCase().indexOf(eccezione.toLowerCase())
          fineEccezione = inizioEccezione + eccezione.length;
          if (inizioEccezione<0){
                racconta+= 1
                continue
            }
            if (eccezione.length >= allergene.length){ 
                if (inizioAllergene>=inizioEccezione && inizioAllergene<=fineEccezione)
                    //no fare nulla
                    a = 0
                else
                ingredienti = mettiInGrassetto(ingredienti,allergene,inizioAllergene)
            }
            else{
              console.log("sono quo");
                if (inizioEccezione>=inizioAllergene & inizioEccezione<=fineAllergene)
                    a = 0
                else
                ingredienti = mettiInGrassetto(ingredienti,allergene,inizioAllergene)
                  a = 0
            }
        }
        if (racconta == eccezioni.length)
          ingredienti = mettiInGrassetto(ingredienti,allergene,inizioAllergene)
      } 
      else
        ingredienti =  mettiInGrassetto(ingredienti,allergene,inizioAllergene)
    }
    return '{\\rtf1\\fs8\\deff0{\\fonttbl{\\f0 Arial;}}'+ingredienti+'\\f0\\fs20\\par}'	;
}

async function saveData(body){
  
  let allergeni = (await getAllergeni("IT")).recordset;
  let ALLERGENI = allergeni[0].ALLERGENI.split(",");
  let EXCEPTIONS = allergeni[0].ECCEZIONI.split(",");
  let item = await getData(body.codice);
  let ss = "";
  let codice= body.codice.replaceAll("'","''") || '';
  let nome= body.nome.replaceAll("'","''") || '';
  let ingredienti= body.ingredienti.replaceAll("'","''") || '';
  let descrizione= body.descrizione.replaceAll("'","''") || '';
  let origine= body.origine.replaceAll("'","''") || '';
  let kj= body.kj.replaceAll("'","''") || '';
  let energia= body.energia.replaceAll("'","''") || '';
  let grassi= body.grassi.replaceAll("'","''") || '';
  let grassi_saturi= body.grassi_saturi.replaceAll("'","''") || '';
  let carboidrati= body.carboidrati.replaceAll("'","''") || '';
  let carboidrati_zuccheri= body.carboidrati_zuccheri.replaceAll("'","''") || '';
  let fibra_alimentare= body.fibra_alimentare.replaceAll("'","''") || '';
  let proteine= body.proteine.replaceAll("'","''") || '';
  let sale= body.sale.replaceAll("'","''") || '';
  let sodio= body.sodio.replaceAll("'","''") || '';
  let tmc= body.tmc.replaceAll("'","''") || '';
  let avvisi= body.avvisi.replaceAll("'","''") || '';
  let peso= body.peso.replaceAll("'","''") || '';
  let txt= body.txt.replaceAll("'","''") || '';
  let cpnp= body.cpnp.replaceAll("'","''") || '';
  let societa= body.societa.replaceAll("'","''") || '';
  let distrubuito= body.distrubuito.replaceAll("'","''") || '';
  let stampante= body.stampante.replaceAll("'","''") || '';
  let doc= body.doc.replaceAll("'","''") || '';
  let btw= body.btw.replaceAll("'","''") || '';
  let flag_stampa_etichetta= body.flag_stampa_etichetta.replaceAll("'","''") || '';
  let ordine= body.ordine.replaceAll("'","''") || '';
  let tipol= body.tipol.replaceAll("'","''") || '';
  let num_etich= body.num_etich.replaceAll("'","''") || '';
  let print_man= body.print_man.replaceAll("'","''") || '';
  let check= body.check.replaceAll("'","''") === "True" || 0;
  let ingredienti_allergeni = ricalcolaAllergeni(ingredienti,ALLERGENI,EXCEPTIONS);
  if (item.recordset.length === 0){
      ss = `INSERT INTO  DATA(CODICE,NOME,INGREDIENTI,DESCRIZIONE,ORIGINE,KJ,ENERGIA,GRASSI,GRASSI_SATURI,
          CARBOIDRATI,CARBOIDRATI_ZUCCHERI,FIBRA_ALIMENTARE,PROTEINE,SALE,SODIO,TMC,AVVISI,PESO,TXT,CPNP,
          SOCIETA,DISTRUBUITO,STAMPANTE,DOC,BTW,FLAG_STAMPA_ETICHETTA,ORDINE,TIPOL,NUM_ETICH,PRINT_MAN,[CHECK],ingredienti_allergeni) VALUES(
              '${codice}','${nome}','${ingredienti}','${descrizione}','${origine}','${kj}','${energia}','${grassi}','${grassi_saturi}','${
                  carboidrati}','${carboidrati_zuccheri}','${fibra_alimentare}','${proteine}','${sale}','${sodio}','${tmc}','${avvisi}','${peso}','${txt}','${cpnp}','${
                  societa}','${distrubuito}','${stampante}','${doc}','${btw}','${flag_stampa_etichetta}','${ordine}','${tipol}','${num_etich}','${print_man}',${check},'${ingredienti_allergeni}'
          )`
  }
  else {
      ss = `
      INSERT INTO DATA_HISTORY(Data,CODICE,NOME,INGREDIENTI,DESCRIZIONE,ORIGINE,KJ,ENERGIA,GRASSI,GRASSI_SATURI,
        CARBOIDRATI,CARBOIDRATI_ZUCCHERI,FIBRA_ALIMENTARE,PROTEINE,SALE,SODIO,TMC,AVVISI,PESO,TXT,CPNP,
        SOCIETA,DISTRUBUITO,STAMPANTE,DOC,BTW,FLAG_STAMPA_ETICHETTA,ORDINE,TIPOL,NUM_ETICH,PRINT_MAN,[CHECK],ingredienti_allergeni)
        SELECT GETDATE(),CODICE,NOME,INGREDIENTI,DESCRIZIONE,ORIGINE,KJ,ENERGIA,GRASSI,GRASSI_SATURI,
        CARBOIDRATI,CARBOIDRATI_ZUCCHERI,FIBRA_ALIMENTARE,PROTEINE,SALE,SODIO,TMC,AVVISI,PESO,TXT,CPNP,
        SOCIETA,DISTRUBUITO,STAMPANTE,DOC,BTW,FLAG_STAMPA_ETICHETTA,ORDINE,TIPOL,NUM_ETICH,PRINT_MAN,[CHECK],ingredienti_allergeni
        FROM DATA
        WHERE codice = '${codice}'

        
      UPDATE DATA SET 
      nome = '${nome}',
      ingredienti = '${ingredienti}',
      descrizione = '${descrizione}',
      origine = '${origine}',
      kj = '${kj}',
      energia = '${energia}',
      grassi = '${grassi}',
      grassi_saturi = '${grassi_saturi}',
      carboidrati = '${carboidrati}',
      carboidrati_zuccheri = '${carboidrati_zuccheri}',
      fibra_alimentare = '${fibra_alimentare}',
      proteine = '${proteine}',
      sale = '${sale}',
      sodio = '${sodio}',
      tmc = '${tmc}',
      avvisi = '${avvisi}',
      peso = '${peso}',
      txt = '${txt}',
      cpnp = '${cpnp}',
      societa = '${societa}',
      distrubuito = '${distrubuito}',
      stampante = '${stampante}',
      doc = '${doc}',
      btw = '${btw}',
      flag_stampa_etichetta = '${flag_stampa_etichetta}',
      ordine = '${ordine}',
      tipol = '${tipol}',
      num_etich = '${num_etich}',
      print_man = '${print_man}',
      ingredienti_allergeni = '${ingredienti_allergeni}',
      [check] = ${check} WHERE codice = '${codice}'`;
  }
  console.log(ss);
  return await connection.query(ss);
}
async function saveAllergene(body){
  
  let allergeni = (await getAllergeni("IT")).recordset;
  let ALLERGENI = allergeni[0].ALLERGENI.split(",");
  let EXCEPTIONS = allergeni[0].ECCEZIONI.split(",");
  let item = await getAllergeni(body.id);
  if (item.recordset.length === 0){
      ss = `INSERT INTO  ALLERGENI(ALLERGENI,ECCEZIONI,lingua) VALUES(
              '${body.allergeni}',''${body.eccezioni}',''${body.lingua}'
          )`
  }
  else {
      ss = `
      UPDATE ALLERGENI SET 
      ALLERGENI = '${body.allergeni}',
      ECCEZIONI = '${body.eccezioni}',
      lingua = '${body.lingua}'`;
  }
  return await connection.query(ss);
}

