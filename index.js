const express = require('express')
const path = require('path')
const sql = require('mssql')
const PORT = process.env.PORT || 5000
const http = require('http')
const bodyParser = require('body-parser');
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
  .get('/api',async (request, response) => {
    try{
      const data = await getData(request.query.codice);
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
  .post('/api',jsonParser,async (request, response) => {
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
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

  async function getData(codice){
    ss = "";
    if (codice )
        ss = `SELECT * FROM DATA WHERE codice = '${codice}'`
    else
        ss  = "SELECT * FROM DATA";
    return await connection.query(ss);
}


async function saveData(body){
    let item = await getData(body.codice);
    let ss = "";
    let codice= body.codice || '';
    let nome= body.nome || '';
    let ingredienti= body.ingredienti || '';
    let descrizione= body.descrizione || '';
    let origine= body.origine || '';
    let kj= body.kj || '';
    let energia= body.energia || '';
    let grassi= body.grassi || '';
    let grassi_saturi= body.grassi_saturi || '';
    let carboidrati= body.carboidrati || '';
    let carboidrati_zuccheri= body.carboidrati_zuccheri || '';
    let fibra_alimentare= body.fibra_alimentare || '';
    let proteine= body.proteine || '';
    let sale= body.sale || '';
    let sodio= body.sodio || '';
    let tmc= body.tmc || '';
    let avvisi= body.avvisi || '';
    let peso= body.peso || '';
    let txt= body.txt || '';
    let cpnp= body.cpnp || '';
    let societa= body.societa || '';
    let distrubuito= body.distrubuito || '';
    let stampante= body.stampante || '';
    let doc= body.doc || '';
    let btw= body.btw || '';
    let flag_stampa_etichetta= body.flag_stampa_etichetta || '';
    let ordine= body.ordine || '';
    let tipol= body.tipol || '';
    let num_etich= body.num_etich || '';
    let print_man= body.print_man || '';
    let check= body.check || 0;
    console.log(item.recordset);
    if (item.recordset.length === 0){
        ss = `INSERT INTO  DATA(CODICE,NOME,INGREDIENTI,DESCRIZIONE,ORIGINE,KJ,ENERGIA,GRASSI,GRASSI_SATURI,
            CARBOIDRATI,CARBOIDRATI_ZUCCHERI,FIBRA_ALIMENTARE,PROTEINE,SALE,SODIO,TMC,AVVISI,PESO,TXT,CPNP,
            SOCIETA,DISTRUBUITO,STAMPANTE,DOC,BTW,FLAG_STAMPA_ETICHETTA,ORDINE,TIPOL,NUM_ETICH,PRINT_MAN,[CHECK]) VALUES(
                '${codice}','${nome}','${ingredienti}','${descrizione}','${origine}','${kj}','${energia}','${grassi}','${grassi_saturi}','${
                    carboidrati}','${carboidrati_zuccheri}','${fibra_alimentare}','${proteine}','${sale}','${sodio}','${tmc}','${avvisi}','${peso}','${txt}','${cpnp}','${
                    societa}','${distrubuito}','${stampante}','${doc}','${btw}','${flag_stampa_etichetta}','${ordine}','${tipol}','${num_etich}','${print_man}',${check}
            )`
    }
    else {
        ss = `UPDATE DATA SET 
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
        [check] = ${check} WHERE codice = '${codice}'`;
    }
    return await connection.query(ss);
}

