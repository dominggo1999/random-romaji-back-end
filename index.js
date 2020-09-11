const express = require('express');
const app = express();
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const Kuroshiro = require('kuroshiro'); 
const kuroshiro = new Kuroshiro(); //instantiate
const kuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");

const PORT = process.env.PORT || 5554;

// Initialize kuroshiro
const activateKuroshiro = async () =>{
	await kuroshiro.init(new kuromojiAnalyzer());
}

// Call 
activateKuroshiro();

// Body parser
// create application/json parser
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json())

// Enasble cors policy
app.use((req,res,next)=>{
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header(
	    "Access-Control-Allow-Headers",
	    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
	  );
	  if (req.method === 'OPTIONS') {
	      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
	      return res.status(200).json({});
	  }
	  next();
})

let wordList;

const url = "https://randomwordgenerator.com/json/words_ws.json";

const getWordList = async (url) =>{
	const res = await fetch(url);
	const data = await res.json();
	wordList = data.data;
}

getWordList(url);

app.get('/data', async (req,res)=>{
	await res.json({
		data : wordList
	});
})

app.post('/data/findromaji', async(req,res)=>{
	const q =await req.body.query;

	const dictURL = `https://tangorin.com/words?search=${q}`;
	const result =await fetch(dictURL);
	const html = await result.text();
	
	const $ = cheerio.load(html);

	let kanji = $(".results-dl .entry.words.wordDefinition:nth-child(1) dfn a").text();

	if(kanji==""){
		kanji = $(".results-dl .entry.words.wordDefinition:nth-child(1) dfn").text();

		if(kanji==""){
			kanji = "漢字";
		}
	}

	const test = /[A-Za-z]/ig;

	kanji = kanji.replace(test,'');
	kanji = kanji.replace(/☆/g,'');
	kanji = kanji.replace(/★/g,'');

	const hiragana = await kuroshiro.convert(kanji,{to : "hiragana"});
	const romaji = await kuroshiro.convert(kanji,{to : "romaji"});

	await res.json({
		query : q,
		kanji : kanji,
		hiragana : hiragana,
		romaji : romaji 
	});
})


app.listen(PORT,()=>{
	console.log(`Server is running on port ${PORT}`);
})