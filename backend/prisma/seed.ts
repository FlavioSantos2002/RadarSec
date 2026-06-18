import { PrismaClient, Role, Severity, FindingStatus, Priority } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main(): Promise<void> {
  const existingGestor = await prisma.user.findUnique({
    where: { email: 'gestor@radarsec.dev' },
  });

  if (existingGestor) {
    console.log('Seed já executado. Pulando...');
    return;
  }

  const passwordHash = await bcrypt.hash('Gestor@123', BCRYPT_ROUNDS);
  const hunter1Hash = await bcrypt.hash('Hunter@123', BCRYPT_ROUNDS);
  const hunter2Hash = await bcrypt.hash('Hunter@123', BCRYPT_ROUNDS);

  const gestor = await prisma.user.create({
    data: {
      name: 'Gestor RadarSec',
      email: 'gestor@radarsec.dev',
      passwordHash,
      role: Role.GESTOR,
    },
  });

  const hunter1 = await prisma.user.create({
    data: {
      name: 'Caçador Alfa',
      email: 'hunter1@radarsec.dev',
      passwordHash: hunter1Hash,
      role: Role.HUNTER,
    },
  });

  const hunter2 = await prisma.user.create({
    data: {
      name: 'Caçador Beta',
      email: 'hunter2@radarsec.dev',
      passwordHash: hunter2Hash,
      role: Role.HUNTER,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Pentest Aplicativo XYZ',
      description: 'Avaliação de segurança da aplicação web XYZ — ambiente de homologação.',
      scope: 'app.xyz.com, api.xyz.com, admin.xyz.com',
      members: {
        create: [
          { userId: gestor.id },
          { userId: hunter1.id },
          { userId: hunter2.id },
        ],
      },
    },
  });

  const findingsData = [
    {
      title: 'Injeção SQL no endpoint de login',
      description: 'Parâmetro "username" vulnerável a injeção SQL clássica via aspas simples.',
      attackVector: 'Rede — POST /api/auth/login',
      payload: "' OR '1'='1' --",
      poc: 'curl -X POST https://app.xyz.com/api/auth/login -d "username=\' OR 1=1--&password=x"',
      severity: Severity.CRITICA,
      cvssScore: 9.8,
      cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      status: FindingStatus.EM_ANALISE,
      authorId: hunter1.id,
    },
    {
      title: 'XSS refletido na busca de produtos',
      description: 'Parâmetro "q" reflete entrada sem sanitização no HTML da resposta.',
      attackVector: 'Rede — GET /search?q=',
      payload: '<script>alert(document.domain)</script>',
      poc: 'https://app.xyz.com/search?q=<script>alert(1)</script>',
      severity: Severity.ALTA,
      cvssScore: 6.1,
      cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
      status: FindingStatus.VALIDADO,
      priority: Priority.ALTA,
      authorId: hunter1.id,
      assignedToId: hunter2.id,
    },
    {
      title: 'IDOR em endpoint de perfil de usuário',
      description: 'Alteração do identificador na URL permite acesso a dados de outros usuários.',
      attackVector: 'Rede — GET /api/users/{id}',
      payload: 'GET /api/users/1001 (autenticado como usuário 1002)',
      severity: Severity.ALTA,
      cvssScore: 7.5,
      status: FindingStatus.EM_ANALISE,
      authorId: hunter2.id,
    },
    {
      title: 'Cabeçalhos de segurança ausentes',
      description: 'Faltam CSP, X-Frame-Options e HSTS nas respostas HTTP.',
      attackVector: 'Rede — todas as páginas',
      severity: Severity.MEDIA,
      cvssScore: 5.3,
      status: FindingStatus.EM_ANALISE,
      authorId: hunter2.id,
    },
    {
      title: 'Versão do servidor exposta',
      description: 'Cabeçalho Server revela nginx/1.18.0 — informativo para reconhecimento.',
      attackVector: 'Rede — resposta HTTP',
      severity: Severity.INFORMATIVA,
      cvssScore: 0.0,
      status: FindingStatus.DESCARTADO,
      authorId: hunter1.id,
    },
  ];

  for (const data of findingsData) {
    const finding = await prisma.finding.create({
      data: { ...data, projectId: project.id },
    });

    await prisma.timelineMessage.createMany({
      data: [
        {
          findingId: finding.id,
          authorUserId: data.authorId,
          content: `Achado registrado durante análise manual do escopo ${project.scope?.split(',')[0]}.`,
        },
        {
          findingId: finding.id,
          authorUserId: data.authorId === hunter1.id ? hunter2.id : hunter1.id,
          content: 'Confirmado no ambiente de homologação. Aguardando revisão entre pares.',
        },
      ],
    });

    const reviewerId = data.authorId === hunter1.id ? hunter2.id : hunter1.id;
    await prisma.peerReview.create({
      data: {
        findingId: finding.id,
        reviewerId,
        approved: data.status === FindingStatus.VALIDADO,
        comment: data.status === FindingStatus.VALIDADO
          ? 'Prova de conceito reproduzida com sucesso. Aprovo a validação.'
          : 'Revisão pendente — aguardando mais evidências.',
      },
    });
  }

  console.log('Seed concluído com sucesso!');
  console.log('Gestor: gestor@radarsec.dev / Gestor@123');
  console.log('Caçador 1: hunter1@radarsec.dev / Hunter@123');
  console.log('Caçador 2: hunter2@radarsec.dev / Hunter@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
