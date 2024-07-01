require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express')
const app = express()
const port = process.env.PORT || 8000 
const genAI = new GoogleGenerativeAI(process.env.api_key);
const Queue = require('bull');
const cors  = require("cors")
const PromptQueue = new Queue('PromptQueue', { redis: { port: process.env.redis_port, host: process.env.redis_host } })

app.use(express.json())
app.use(cors())


async function run(prompt) {
  // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});


  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text)

  return text ; 
}







app.get('/', (req, res) => {
    
  res.send('Hello! World')
})


app.post("/"  , (req,res)=>{

  console.log(req.body)

    PromptQueue.add(req.body).then((job)=>{
        job.finished().then((data) => {
            res.json({ success: true, data: data });
          }).catch((err) => {
            console.log(err)
            res.json({success : false , error : err})
          });
    
      })


    
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




PromptQueue.process(async function (job, done){

    try {
      const generatedText = await run(job.data.prompt); // Pass the prompt from the job data
      done(null, { result: generatedText });
    } catch (error) {
      done(error);
    }
})



