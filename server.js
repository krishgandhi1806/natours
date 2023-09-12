const dotenv= require('dotenv');
const mongoose= require('mongoose');
dotenv.config({path: './config.env'});

const DB= process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(con=>{
    console.log("DB Connection Successful");
})

const app= require('./app');

const port= process.env.PORT || 3000;
const server= app.listen(port, ()=>{
    console.log(`App started on ${port}`);
})


