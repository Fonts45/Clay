import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../assets/scripts/shortcut-detection.js';
const {detect}=globalThis.ClayShortcutDetection;
test('recognizes institutions and their student portals',()=>{
 for(const url of ['https://estacio.br/?srsltid=tracking','https://aluno.estacio.br/login']){
  assert.equal(detect({url}).category,'Faculdade');assert.equal(detect({url}).title,'Estácio');
 }
 for(const host of ['usp.br','unip.br','uninter.com','unicesumar.edu.br','unb.br','harvard.edu','example.edu.br'])assert.equal(detect({url:'https://'+host}).category,'Faculdade');
});
test('recognizes learning platforms regardless of whether their courses are free or paid',()=>{
 for(const host of ['udemy.com','alura.com.br','coursera.org','hotmart.com','domestika.org','khanacademy.org'])assert.equal(detect({url:'https://'+host}).category,'Curso');
 assert.equal(detect({url:'https://www.linkedin.com/learning/javascript'}).category,'Curso');
 assert.equal(detect({url:'https://www.linkedin.com/in/example'}).category,'Pesquisa');
});
test('general knowledge and unknown sites default to research',()=>{
 assert.deepEqual(detect({url:'https://pt.wikipedia.org/wiki/Software'}),{category:'Pesquisa',title:'Wikipédia',description:'Conteúdo para consulta e pesquisa'});
 assert.equal(detect({url:'https://example.com'}).category,'Pesquisa');
});
test('PDF wins over institution or platform classification for files and links',()=>{
 assert.equal(detect({url:'https://usp.br/livros/Calculo.PDF?download=1'}).category,'Livro');
 assert.equal(detect({url:'https://udemy.com/download?filename=Guia.pdf'}).title,'Guia');
 assert.deepEqual(detect({kind:'file',fileName:'Engenharia_de-Software.pdf',url:'https://alura.com.br'}),{category:'Livro',title:'Engenharia de Software',description:'Leitura em PDF'});
});
test('ignores inactive file inputs and URL tracking words',()=>{
 assert.equal(detect({kind:'link',fileName:'Livro.pdf',url:'https://alura.com.br'}).category,'Curso');
 assert.equal(detect({url:'https://example.com/?next=estacio.br&campaign=curso-faculdade'}).category,'Pesquisa');
 assert.equal(detect({url:'https://udemy.com.evil.example'}).category,'Pesquisa');
 assert.equal(detect({url:'https://fakeestacio.br'}).category,'Pesquisa');
});
test('handles pasted domains, invalid input, and empty destinations',()=>{
 assert.equal(detect({url:'alura.com.br'}).title,'Alura');
 assert.equal(detect({url:'not a valid address'}).title,'');
 assert.equal(detect().title,'');
 assert.equal(detect({kind:'file',fileName:'Resumo.docx',url:'https://estacio.br'}).category,'Pesquisa');
});
