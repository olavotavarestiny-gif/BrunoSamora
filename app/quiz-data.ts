export const questions = [
 {title:'És homem ou mulher?', options:['Homem','Mulher'], image:'01-genero.webp', alt:'Um homem e uma mulher negros, com corpos comuns, num ambiente luminoso.'},
 {title:'Vives ou trabalhas em Talatona?', options:['Sim, vivo em Talatona','Sim, trabalho em Talatona','Não, estou longe de Talatona'], image:'02-localizacao.webp', alt:'Dois profissionais negros a caminhar junto a um edifício moderno.'},
 {title:'Como está o teu corpo hoje?', options:['Quero reduzir peso','Sou magro/a e quero ganhar corpo','Quero melhorar a minha forma','Estou a recomeçar'], image:'03-corpo.webp', alt:'Três pessoas negras de diferentes idades e corpos, com roupa desportiva.'},
 {title:'Que resultado queres alcançar?', options:['Perder gordura','Ganhar massa muscular','Ter mais energia e saúde','Sentir-me melhor no meu corpo'], image:'04-objetivos.webp', alt:'Uma mulher e um homem negros a praticar exercício leve num ginásio luminoso.'},
 {title:'O que mais te impede?', options:['Falta de tempo','Não sei por onde começar','Tenho vergonha de começar','Já tentei e não consegui'], image:'05-barreiras.webp', alt:'Duas pessoas negras sentadas num banco de ginásio, num momento de apoio e confiança.'},
];
export function validPhone(phone:string){return /^\+?[\d\s()-]+$/.test(phone) && phone.replace(/\D/g,'').length>=9 && phone.replace(/\D/g,'').length<=15;}
