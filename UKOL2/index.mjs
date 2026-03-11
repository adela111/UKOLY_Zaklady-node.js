import fs from 'fs'

if (!fs.existsSync('instrukce.txt')) {
    console.log('Subor instrukce.txt neexistuje');
} else {
    const instrukce = fs.readFileSync('instrukce.txt','utf-8');
    const [vstup,vystup] = instrukce.split(' ');

    if (!fs.existsSync(vstup)) {
        console.log('Subor vstup.txt neexistuje');
    } else {
        const data = fs.readFileSync(vstup, 'utf-8');
        fs.writeFileSync(vystup, data);
        console.log('Hotovo')
    }
}


