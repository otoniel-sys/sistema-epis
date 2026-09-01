const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create some mock Employees
  const emp1 = await prisma.employee.create({
    data: {
      name: 'João Silva',
      role: 'Ajudante de motorista',
      department: 'Logística',
    },
  })

  const emp2 = await prisma.employee.create({
    data: {
      name: 'Maria Souza',
      role: 'Operador de Empilhadeira',
      department: 'Logística',
    },
  })

  // Create some EPIs
  const epi1 = await prisma.equipment.create({
    data: {
      description: 'Bota de segurança amarração',
      ca: '28511',
      type: 'EPI',
      idealStock: 10,
      currentStock: 5,
      unitValue: 75.0,
      lifespanMonths: 12,
      replacementCriteria: 'Desgaste, rasgos, solado comprometido',
    },
  })

  const epi2 = await prisma.equipment.create({
    data: {
      description: 'Luva anticorte',
      ca: '12345',
      type: 'EPI',
      idealStock: 20,
      currentStock: 25,
      unitValue: 15.0,
      lifespanMonths: 3,
      replacementCriteria: 'Furos ou rasgos',
    },
  })

  const uniforme1 = await prisma.equipment.create({
    data: {
      description: 'Calça Cinza com Refletivo',
      ca: 'NOK',
      type: 'UNIFORME',
      idealStock: 15,
      currentStock: 0,
      unitValue: 73.0,
      lifespanMonths: 6,
      replacementCriteria: 'Desgaste',
    },
  })

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
