const fs= require('fs');
const dotenv= require('dotenv');
const mongoose= require('mongoose');
const Tour= require('../../models/tourModel');
const User= require('../../models/userModel');
const Review= require('../../models/reviewModel');
dotenv.config({path: '../../config.env'});

const DB= process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(con=>{
    console.log("DB Connection Successful");
})

const tours= JSON.parse(fs.readFileSync(`./tours.json`, 'utf-8'));
// const users= JSON.parse(fs.readFileSync(`./users.json`, 'utf-8'));
// const reviews= JSON.parse(fs.readFileSync(`./reviews.json`, 'utf-8'));

const importdata = async ()=>{
    try
    {
        await Tour.create(tours);
        // await User.create(users, { validateBeforeSave: false});
        // await Review.create(reviews);
        console.log("Data successfully imported");
    // process.exit();
    // console.log(tours);
}
    catch(err)
    {
        console.log(err);
    }
}

const deletedata = async ()=>{
    try
    {
        await Tour.deleteMany();
        // await User.deleteMany();
        // await Review.deleteMany();
        console.log("Data successfully deleted");}
    catch(err)
    {
        console.log(err);
    }
}

if(process.argv[2]== '--import')
{
    setTimeout(importdata, 6000);
    // importdata();
}
else if(process.argv[2]= '--delete')
{
    deletedata();
}