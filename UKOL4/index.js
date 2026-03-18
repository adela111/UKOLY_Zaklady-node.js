import chalk from "chalk"
import http from "http"
import fs from 'fs/promises'
import path from 'path'

const server = http.createServer(async(request, response)=> {

    if (request.url=== '/'){
        try {
            const data = await fs.readFile('index.html')
            response.statusCode=200
            response.setHeader('Content-Type', 'text/html')
            response.end(data)
        } catch (error) {
            response.statusCode=500
            response.end('Chyba servera- subor neexistuje alebo sa vyskytol problem s jeho nacitanim')
        }
        
    } else {
        const filePath= path.join('public', request.url.slice(1))
        try {
            const data = await fs.readFile(filePath)
            response.statusCode=200
            
            if (request.url.endsWith(".txt")) {
                response.setHeader("Content-Type", "text/plain")
            } else if (request.url.endsWith(".html")) {
                response.setHeader("Content-Type", "text/html")
            } else if (request.url.endsWith(".jpg")) {
                response.setHeader("Content-Type", "image/jpeg")
            } else if (request.url.endsWith(".png")) {
                response.setHeader("Content-Type", "image/png")
            }
            response.end(data)
        } catch (error) {
            const data404 = await fs.readFile('404.html')
            response.statusCode=404
            response.setHeader('Content-Type', 'text/html')
            response.end(data404)

        }
    }
})

server.listen(8080,'localhost', () => {
    console.log(chalk.blue('Server funguje na http://localhost:8080'))
})
