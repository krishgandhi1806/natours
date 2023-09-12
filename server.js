const dotenv= require('dotenv');
const mongoose= require('mongoose');
dotenv.config({path: './config.env'});

process.on('uncaughtException', err=>{
    // console.log("UNCAUGHT Exception. Shutting down the application");
    // console.log(err.name, err.message);
    // console.log(err);
    process.exit(1);
})

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

process.on('unhandledRejection', err=>{
    console.log(err.name, err.message);
    // console.log(err);
    // console.log("UNHANDLED REJECTION. Shutting down the application");
    server.close(()=>{
        process.exit(1);
    })
})

