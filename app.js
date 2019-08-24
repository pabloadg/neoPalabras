var express = require ('express');
var path = require ('path');
var logger = require ('morgan');
var bodyParser = require ('body-parser');
var neo4j = require('neo4j-driver').v1;

var app = express();

app.set('views',path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use (bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname,'public')));

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
var session = driver.session();

app.get ('/', function (req, res){
    session
        .run('MATCH(n:palabra) RETURN n')
        .then(function(result){
            var palabraArr = [];
            result.records.forEach(function(record){
                palabraArr.push({
                    id: record._fields[0].identity.low,
                    lema : record._fields[0].properties.lema,
                    Definicion : record._fields[0].properties.Definicion
                });
                
            });

            session
            .run('MATCH(n:region) RETURN n')
            .then(function(result2){
                var regionArr = [];
                result2.records.forEach(function(record){
                    regionArr.push({
                        id: record._fields[0].identity.low,
                        nombre : record._fields[0].properties.nombre                        
                });
                                 
            })
            res.render('index', {
                palabras: palabraArr,
                region: regionArr,
                palabra1:[]
            });
        })

            .catch(function(err){
                console.log(err);
            });
        })

        .catch(function(err){
            console.log(err);
        });
    
    });
    app.post('/palabra/add' ,function(req, res){
        var lema =req.body.lema;
        var Definicion =req.body.Definicion;
        
        session
        .run('CREATE(n:palabra {lema:{lemaPara},Definicion:{defPara}}) Return n.lema, n.Definicion', {lemaPara:lema,defPara:Definicion})
        .then(function(result){
            
            res.redirect('/');
            session.close();
        })
        .catch(function(err){
            console.log(err);
        });      
    res.redirect('/');
});

app.post('/buscar/add/' ,function(req, res){
    var lema =req.body.lema;

    session
    .run('MATCH (c:palabra) WHERE c.lema= {lemaPara} RETURN c.Definicion', {lemaPara: lema} )
    .then(function(result){
        res.render('index', {
            
            palabras: [],
            region: [],
            palabra1 : result.records[0]._fields[0]
        })
                    session.close();
                  
    })

    .catch(function(err){
        console.log(err);
    }); 
})

app.post('/palabra/region/add' ,function(req, res){
    var lema =req.body.lema;
    var nombre =req.body.nombre;
    
    session
    .run('match(a:region{nombre:{nombreParam}}),(b:palabra{lema:{lemaParam}}) MERGE(a)-[r:Se_utiliza_en]-(b) Return a,b', {lemaParam:lema, nombreParam:nombre})
    .then(function(result){
        res.redirect('/');
        session.close();
    })
    .catch(function(err){
        console.log(err);
    });      
res.redirect('/');
});

app.listen(3001);
console.log ('Server started ');
module.exports = app;