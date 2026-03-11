import fs from 'fs/promises';
async function funkcia() {
    const instrukce= await fs.readFile('instrukce.txt','utf-8');
    const n =Number(instrukce);
    const subory = []
    for (let i=0; i<=n; i++){
        const subor= fs.writeFile(i+'.txt', 'Subor '+i);
        subory.push(subor);
    }
    await Promise.all(subory);
    console.log('Subory uspesne vytvorene :)')
}
funkcia();
