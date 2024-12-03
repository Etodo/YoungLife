import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import process from 'process';
import sqlite3 from 'sqlite3';
import path from 'path';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const database = new sqlite3.Database('C:\\Users\\sirpl\\Downloads\\Backend server\\sqlite (4).db', (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to the SQLite database');
    }
  });


async function sendData (tableID, info){ 
        
}

async function dataValidation (tableID, field, info){
    
}

app.use((req, res, next) => { //cors bypass policy

    res.header('Access-Control-Allow-Origin', '*');  
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); 
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if(req.method == 'OPTIONS'){
        
        return res.status(200).end();
    }

    next();

});

app.get('/test', (req, res) => { //tests that the server can send a get request
    res.send('Server is working!');
});

app.post('/submit-YLdata', async (req, res) => {
    try{

        console.log('Form type:', req.body[0].name);
        console.log('full form:', req.body);

        const formData = req.body;
        const formType = req.body[0].name;
    

        if(formType == 'studentRegistration'){
            
            
            
            

        } 

        //else{

        //}

        return res.status(200).json({ message: 'Data received successfully', receivedData: formData});
    }
    catch(error){

        console.error('error submitting data: ', error);
        return res.status(500).json({

            message: 'there was an error submitting the data',
            error: error.response?.data || error.message,
        });
    }

   

});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
