import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import path from 'path';


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
// Middleware to parse JSON
app.use(bodyParser.json());

const dbPath = path.resolve('sqlite (4).db')
const database = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to the SQLite database');
    }
  });

async function runQuery(query, parameters =[]){

    return new Promise((resolve, reject) => {
        database.run(query, parameters, function(err){

            if(err) reject(err);
            else resolve(this.lastID);
        });
    });
}

async function getQueries(query){

    return new Promise((resolve, reject) => {

        database.all(query, [], function(err, rows){

            if(err) reject(err);
            else resolve(rows);
            console.log(rows);
        })
    })
}

async function getQuery(query, parameters = []){

    return new Promise((resolve, reject) => {
        database.get(query, parameters, function(err, rows){

            if(err) reject(err);
            else resolve(rows);
            console.log(rows);

        });
    });
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
app.get('/get-eventInfo', async (req, res) => { 
    try{
        const retrieve_event_addresses = `SELECT ADDRESS.STREET_ADD FROM EVENT JOIN ADDRESS ON EVENT.ADDRESS_ID = ADDRESS.ADDRESS_ID`;
        const retrieve_events = `SELECT EVENT_ID, EVENT_NAME, EVENT_DATE FROM EVENT`;
        const retrieve_students = `SELECT STUDENT.STUDENT_ID FROM STU_ENROLL JOIN STUDENT ON STU_ENROLL.STUDENT_ID = STUDENT.STUDENT_ID`;
        const retrieve_event_information =  `
                        SELECT 
                            EVENT.EVENT_NAME,
                            EVENT.EVENT_DATE,
                            ADDRESS.STREET_ADD,
                            STUDENT.FIRST_NAME AS STUDENT_FIRST_NAME,
                            STUDENT.LAST_NAME AS STUDENT_LAST_NAME,
                            LEADER.FIRST_NAME AS LEADER_FIRST_NAME,
                            LEADER.LAST_NAME AS LEADER_LAST_NAME
                        FROM 
                            EVENT
                        JOIN 
                            ADDRESS
                            ON EVENT.ADDRESS_ID = ADDRESS.ADDRESS_ID
                        LEFT JOIN 
                            STU_ENROLL 
                            ON EVENT.EVENT_ID = STU_ENROLL.EVENT_ID
                        LEFT JOIN 
                            STUDENT 
                            ON STU_ENROLL.STUDENT_ID = STUDENT.STUDENT_ID
                        LEFT JOIN 
                            LEADER_ENROLL 
                            ON EVENT.EVENT_ID = LEADER_ENROLL.EVENT_ID
                        LEFT JOIN 
                            LEADER
                            ON LEADER_ENROLL.LEADER_ID = LEADER.LEADER_ID
                        ORDER BY 
                            EVENT.EVENT_ID, STUDENT.LAST_NAME, STUDENT.FIRST_NAME, LEADER.LAST_NAME, LEADER.FIRST_NAME
                    `;
        const eventInfo = await getQueries(retrieve_event_information);
        console.log(retrieve_event_information);
        res.status(200).json(eventInfo);

    }
    catch(error){

        console.error('error retrieving data: ', error);
        return res.status(500).json({

            message: 'there was an error retrieving the data',
            error: error.response?.data || error.message,
        });
    }
    
});

app.get('/get-events', async (req, res) => { 
    try{

        const retrieve_events = `SELECT EVENT_ID, EVENT_NAME, EVENT_DATE FROM EVENT`;
        const events = await getQueries(retrieve_events);
        console.log(events);
        res.status(200).json(events);

    }
    catch(error){

        console.error('error retrieving data: ', error);
        return res.status(500).json({

            message: 'there was an error retrieving the data',
            error: error.response?.data || error.message,
        });
    }
    
});

app.post('/submit-YLdata', async (req, res) => {
    try{

        console.log('Form type:', req.body[0].name);
        console.log('full form:', req.body);

        const formData = req.body;
        const formType = req.body[0].name;
        const address_Insert = `INSERT INTO ADDRESS (STREET_ADD, CITY, ZIP, STATE) VALUES (?, ?, ?, ?)`;
        const student_Insert = `INSERT INTO STUDENT (CLUB_ID, SCHOOL_ID, ADDRESS_ID, FIRST_NAME, LAST_NAME, PHONE_NUM, GRAD_YEAR) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const guardian_Insert =  `INSERT INTO GUARDIAN (STUDENT_ID, ADDRESS_ID, FIRST_NAME, LAST_NAME, PHONE_NUM, EMAIL) VALUES (?, ?, ?, ?, ?, ?)`;
        const leader_Insert = `INSERT INTO LEADER (CLUB_ID, FIRST_NAME, LAST_NAME, PHONE_NUM, EMAIL) VALUES (?, ?, ?, ?, ?)`;
        const event_Insert =`INSERT INTO EVENT (ADDRESS_ID, CLUB_ID, EVENT_NAME, EVENT_DATE) VALUES (?, ?, ?, ?)`;
        const student_enroll_Insert = `INSERT INTO STU_ENROLL (STUDENT_ID, EVENT_ID) VALUES (?, ?)`;
        const get_StudentID = `SELECT STUDENT_ID FROM STUDENT WHERE FIRST_NAME = ? AND LAST_NAME = ? AND PHONE_NUM = ?`;
        const get_LeaderID = `SELECT LEADER_ID FROM LEADER WHERE FIRST_NAME = ? AND LAST_NAME = ? AND PHONE_NUM = ?`;
        const leader_enroll_Insert = `INSERT INTO LEADER_ENROLL (LEADER_ID, EVENT_ID) VALUES (?, ?)`;

        


        if(formType == 'studentRegistration'){

            var i = 1;
            const student_Address = formData[i ++];
            var guardian_Address = null;
            if(formData.length > 4){
                guardian_Address = formData[i ++];
            }

            const student = formData[i ++];
            const guardian = formData[i];

            let student_AddressID = null;
            let guardian_AddressID = null;
            let student_ID = null;
            let guardian_ID = null;

            //insert into the student address table

            student_AddressID = await runQuery(address_Insert,[
                student_Address.STREET_ADD,
                student_Address.CITY,
                student_Address.ZIP,
                student_Address.STATE

            ]);

            console.log('students address ID:', student_AddressID);

            //insert into the student table

            student_ID = await runQuery(student_Insert, [
                student.CLUB_ID,
                student.SCHOOL_ID,
                student_AddressID,
                student.FIRST_NAME,
                student.LAST_NAME,
                student.PHONE_NUM,
                student.GRAD_YEAR
            ]);

            console.log('students ID', student_ID);


            //if guardian_Address is seperate submit guardian address into address table

            if(guardian_Address){

                guardian_AddressID = await runQuery(address_Insert, [
                    guardian_Address.STREET_ADD,
                    guardian_Address.CITY,
                    guardian_Address.ZIP,
                    guardian_Address.STATE

                ]);
            }
            else{ //if not use student address id
                guardian_AddressID = student_AddressID;
            }

            console.log('guardians address ID', guardian_AddressID);

            //submit into guardian table
            guardian_ID = await runQuery(guardian_Insert, [

                student_ID,
                guardian_AddressID,
                guardian.FIRST_NAME,
                guardian.LAST_NAME,
                guardian.PHONE_NUM,
                guardian.EMAIL
            ])

            console.log('guardian ID', guardian_ID);


            
        } 

        else if(formType === 'leaderRegistration'){
            //insert leader information
            const leader_info = formData[1];
            let leaderID = await runQuery(leader_Insert, [
                leader_info.CLUB_ID,
                leader_info.FIRST_NAME,
                leader_info.LAST_NAME,
                leader_info.PHONE_NUM,
                leader_info.EMAIL
            ]);
            console.log('LeaderID:', leaderID);
        }

        else if(formType === 'eventCreation'){
            
            const event_information = formData[1];
            const event_address = formData[2];

            let event_AddressID = null;
            event_AddressID = await runQuery(address_Insert, [

                event_address.STREET_ADD,
                event_address.CITY,
                event_address.ZIP,
                event_address.STATE

            ]);

            let eventID = await runQuery(event_Insert, [

                event_AddressID,
                event_information.CLUB_ID,
                event_information.EVENT_NAME,
                event_information.EVENT_DATE,

            ]);
        }

        else if(formType === 'studentEnrollment'){
            const eventID = formData[1];
            const student = formData[2];
            const student_ID = await getQuery(get_StudentID, [

                student.FIRST_NAME,
                student.LAST_NAME,
                student.PHONE_NUM
            ]);

            await runQuery(student_enroll_Insert, [

                student_ID.STUDENT_ID,
                eventID.EVENT_ID,

            ]); 
        }

        else if(formType === 'leaderEnrollment'){
            const eventID = formData[1];
            const leader = formData[2];
            const leader_ID = await getQuery(get_LeaderID, [

                leader.FIRST_NAME,
                leader.LAST_NAME,
                leader.PHONE_NUM
            ]);

            await runQuery(leader_enroll_Insert, [

                leader_ID.LEADER_ID,
                eventID.EVENT_ID,

            ]); 
        }

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
