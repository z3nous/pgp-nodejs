const openpgp = require('openpgp');
const http = require('http');
const csv = require('csv-parser');
const fs = require('fs');
const { error } = require('console');
const util = require('util');


async function encryptCsv(csvFileList,filePath,timestamp){
    for(let i =0;i<csvFileList.length;i++){
        let csvFile = csvFileList[i];
        let readStream= fs.createReadStream(csvFile);
        var reg = /([^\\/]+)-([^\\/]+)\.([^\\/]+)/i;
        const filename = reg.exec(csvFile)[1];
        const Encrypt_CsvFile = `encrypt-${filename}-${timestamp}.csv`;
        const EncryptedCsvFile = fs.createWriteStream(Encrypt_CsvFile,{encoding:'utf-8'});
        const message = await openpgp.createMessage({ binary: readStream });
        const encrypted = await openpgp.encrypt({
            message, // input as Message object
            passwords: ['secret stuff'], // multiple passwords possible
            format: 'binary' // don't ASCII armor (for Uint8Array output)
        });
        await new Promise((resolve,reject)=>{
            encrypted.pipe(EncryptedCsvFile)
            encrypted.on('error', 
            err=>reject(err))
            encrypted.on('end',()=>{
                resolve();
            })
        }).catch(err=>{
            console.log(err)
        })
        console.log('%s has been encrypted successfully', csvFile);
    }
  
    return;
}

async function decryptCsv(csvFilelist,filePath,timestamp){
    for(let i =0;i<csvFilelist.length;i++){
        let csvFile = csvFilelist[i];
        let ReadStream;
        var reg = /encrypt-([^\\/]+)-([^\\/]+)\.([^\\/]+)/i;
        const filename = reg.exec(csvFile)[1];
        const Decrypt_CsvFile = `decrypt-${filename}-${timestamp}.csv`;
        await new Promise((resolve,reject)=>{
            ReadStream = fs.createReadStream(csvFile);
            ReadStream.on('error',err=>reject(err))
            ReadStream.on('open',()=>{
                resolve();
            })
        }).catch(err=>{
            console.log(err)
        })
        const DecryptedCsvFile = fs.createWriteStream(Decrypt_CsvFile);
        const encryptedMessage = await openpgp.readMessage({
            binaryMessage: ReadStream // parse encrypted bytes
        });
        const { data: decrypted } = await openpgp.decrypt({
            message: encryptedMessage,
            passwords: ['secret stuff'], // decrypt with password
            format: 'binary',
        });
        await new Promise((resolve,reject)=>{
            decrypted.pipe(DecryptedCsvFile)
            decrypted.on('error', 
                err=>reject(err))
            decrypted.on('end',()=>{
                resolve();
            })
        }).catch(err=>{
            console.log(err)
        })    
        console.log('%s has been decrypted successfully', csvFile);
    }
}

(async () => {
    await encryptCsv(['ideaIU-2022123123.3.1.exe'], __dirname, 'January_4th_2023');
    await decryptCsv(['encrypt-ideaIU-January_4th_2023.csv'], __dirname, 'January_4th_2023');
})().catch((error)=>console.log(error));






