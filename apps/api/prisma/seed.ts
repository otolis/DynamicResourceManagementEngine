import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

// Type alias for DataType from Prisma
const DataType = {
  STRING: 'STRING',
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  DECIMAL: 'DECIMAL',
  DATE: 'DATE',
  DATETIME: 'DATETIME',
  BOOLEAN: 'BOOLEAN',
  ENUM: 'ENUM',
  RELATION: 'RELATION',
  JSON: 'JSON',
} as const;

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding database...');

    // ==========================================================================
    // 1. Create Demo Tenant
    // ==========================================================================
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'demo' },
        update: {},
        create: {
            name: 'Demo Organization',
            slug: 'demo',
            isActive: true,
        },
    });
    console.log(`Created tenant: ${tenant.name} (${tenant.id})`);

    // ==========================================================================
    // 2. Create Permissions
    // ==========================================================================
    const resources = ['entityType', 'entityInstance', 'workflow', 'user', 'role', 'accessPolicy'];
    const actions = ['create', 'read', 'update', 'delete', 'manage'];

    const permissions = [];
    for (const resource of resources) {
        for (const action of actions) {
            const permission = await prisma.permission.upsert({
                where: { resource_action: { resource, action } },
                update: {},
                create: { resource, action },
            });
            permissions.push(permission);
        }
    }
    console.log(`Created ${permissions.length} permissions`);

    // ==========================================================================
    // 3. Create System Roles
    // ==========================================================================
    const adminRole = await prisma.role.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'admin' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'admin',
            displayName: 'Administrator',
            description: 'Full system access',
            isSystem: true,
        },
    });

    const managerRole = await prisma.role.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'manager' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'manager',
            displayName: 'Manager',
            description: 'Can manage entities and workflows',
            isSystem: true,
        },
    });

    const memberRole = await prisma.role.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'member' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'member',
            displayName: 'Member',
            description: 'Basic access to entities',
            isSystem: true,
        },
    });
    console.log('Created roles: admin, manager, member');

    // ==========================================================================
    // 4. Assign Permissions to Roles
    // ==========================================================================
    // Admin gets all permissions
    const managePermissions = permissions.filter(p => p.action === 'manage');
    for (const permission of managePermissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
            update: {},
            create: { roleId: adminRole.id, permissionId: permission.id },
        });
    }

    // Manager gets CRUD on entities
    const managerPermissions = permissions.filter(
        p => ['entityType', 'entityInstance', 'workflow'].includes(p.resource) && p.action !== 'manage'
    );
    for (const permission of managerPermissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: managerRole.id, permissionId: permission.id } },
            update: {},
            create: { roleId: managerRole.id, permissionId: permission.id },
        });
    }

    // Member gets read access only
    const memberPermissions = permissions.filter(
        p => ['entityType', 'entityInstance'].includes(p.resource) && p.action === 'read'
    );
    for (const permission of memberPermissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: memberRole.id, permissionId: permission.id } },
            update: {},
            create: { roleId: memberRole.id, permissionId: permission.id },
        });
    }
    console.log('Assigned permissions to roles');

    // ==========================================================================
    // 5. Create Admin User
    // ==========================================================================
    const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
    const adminUser = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.local' } },
        update: {},
        create: {
            tenantId: tenant.id,
            email: 'admin@demo.local',
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            isActive: true,
        },
    });

    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
        update: {},
        create: { userId: adminUser.id, roleId: adminRole.id },
    });
    console.log(`Created admin user: admin@demo.local (password: ChangeMe123!)`);

    // ==========================================================================
    // 6. Create Entity Types: Project, Task, Invoice
    // ==========================================================================
    const projectType = await prisma.entityType.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'project' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'project',
            displayName: 'Project',
            description: 'A project to track work and deliverables',
            iconName: 'folder',
            isActive: true,
        },
    });

    const taskType = await prisma.entityType.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'task' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'task',
            displayName: 'Task',
            description: 'An individual work item',
            iconName: 'check-square',
            isActive: true,
        },
    });

    const invoiceType = await prisma.entityType.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'invoice' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'invoice',
            displayName: 'Invoice',
            description: 'A billing invoice',
            iconName: 'file-text',
            isActive: true,
        },
    });
    console.log('Created entity types: project, task, invoice');

    // ==========================================================================
    // 7. Create Attributes for Each Entity Type
    // ==========================================================================
    // Project attributes
    const projectAttributes = [
        { name: 'title', displayName: 'Title', dataType: DataType.STRING, isRequired: true, sortOrder: 1 },
        { name: 'description', displayName: 'Description', dataType: DataType.TEXT, sortOrder: 2 },
        { name: 'startDate', displayName: 'Start Date', dataType: DataType.DATE, sortOrder: 3 },
        { name: 'endDate', displayName: 'End Date', dataType: DataType.DATE, sortOrder: 4 },
        { name: 'budget', displayName: 'Budget', dataType: DataType.DECIMAL, sortOrder: 5 },
        { name: 'isActive', displayName: 'Active', dataType: DataType.BOOLEAN, sortOrder: 6 },
    ];

    for (const attr of projectAttributes) {
        await prisma.attribute.upsert({
            where: { entityTypeId_name: { entityTypeId: projectType.id, name: attr.name } },
            update: {},
            create: {
                tenantId: tenant.id,
                entityTypeId: projectType.id,
                ...attr,
            },
        });
    }

    // Task attributes
    const taskAttributes = [
        { name: 'title', displayName: 'Title', dataType: DataType.STRING, isRequired: true, sortOrder: 1 },
        { name: 'description', displayName: 'Description', dataType: DataType.TEXT, sortOrder: 2 },
        { name: 'dueDate', displayName: 'Due Date', dataType: DataType.DATE, sortOrder: 3 },
        { name: 'priority', displayName: 'Priority', dataType: DataType.ENUM, sortOrder: 4 },
        { name: 'estimatedHours', displayName: 'Estimated Hours', dataType: DataType.NUMBER, sortOrder: 5 },
    ];

    for (const attr of taskAttributes) {
        await prisma.attribute.upsert({
            where: { entityTypeId_name: { entityTypeId: taskType.id, name: attr.name } },
            update: {},
            create: {
                tenantId: tenant.id,
                entityTypeId: taskType.id,
                ...attr,
            },
        });
    }

    // Add priority options
    const priorityAttr = await prisma.attribute.findUnique({
        where: { entityTypeId_name: { entityTypeId: taskType.id, name: 'priority' } },
    });
    if (priorityAttr) {
        const priorities = ['low', 'medium', 'high', 'urgent'];
        for (let i = 0; i < priorities.length; i++) {
            await prisma.attributeOption.upsert({
                where: { attributeId_value: { attributeId: priorityAttr.id, value: priorities[i] } },
                update: {},
                create: {
                    attributeId: priorityAttr.id,
                    value: priorities[i],
                    displayName: priorities[i].charAt(0).toUpperCase() + priorities[i].slice(1),
                    sortOrder: i + 1,
                },
            });
        }
    }

    // Invoice attributes
    const invoiceAttributes = [
        { name: 'invoiceNumber', displayName: 'Invoice Number', dataType: DataType.STRING, isRequired: true, isUnique: true, sortOrder: 1 },
        { name: 'clientName', displayName: 'Client Name', dataType: DataType.STRING, isRequired: true, sortOrder: 2 },
        { name: 'amount', displayName: 'Amount', dataType: DataType.DECIMAL, isRequired: true, sortOrder: 3 },
        { name: 'issueDate', displayName: 'Issue Date', dataType: DataType.DATE, isRequired: true, sortOrder: 4 },
        { name: 'dueDate', displayName: 'Due Date', dataType: DataType.DATE, sortOrder: 5 },
        { name: 'notes', displayName: 'Notes', dataType: DataType.TEXT, sortOrder: 6 },
    ];

    for (const attr of invoiceAttributes) {
        await prisma.attribute.upsert({
            where: { entityTypeId_name: { entityTypeId: invoiceType.id, name: attr.name } },
            update: {},
            create: {
                tenantId: tenant.id,
                entityTypeId: invoiceType.id,
                ...attr,
            },
        });
    }
    console.log('Created attributes for all entity types');

    // ==========================================================================
    // 8. Create Basic Linear Workflows
    // ==========================================================================
    for (const entityType of [projectType, taskType, invoiceType]) {
        const workflow = await prisma.workflowDefinition.upsert({
            where: { tenantId_entityTypeId_name: { tenantId: tenant.id, entityTypeId: entityType.id, name: 'default' } },
            update: {},
            create: {
                tenantId: tenant.id,
                entityTypeId: entityType.id,
                name: 'default',
                displayName: 'Default Workflow',
                description: 'Basic linear workflow',
                isActive: true,
            },
        });

        // Create states: draft -> active -> completed
        const draftState = await prisma.workflowState.upsert({
            where: { workflowDefinitionId_name: { workflowDefinitionId: workflow.id, name: 'draft' } },
            update: {},
            create: {
                workflowDefinitionId: workflow.id,
                name: 'draft',
                displayName: 'Draft',
                color: '#6b7280',
                isInitial: true,
                sortOrder: 1,
            },
        });

        const activeState = await prisma.workflowState.upsert({
            where: { workflowDefinitionId_name: { workflowDefinitionId: workflow.id, name: 'active' } },
            update: {},
            create: {
                workflowDefinitionId: workflow.id,
                name: 'active',
                displayName: 'Active',
                color: '#3b82f6',
                sortOrder: 2,
            },
        });

        const completedState = await prisma.workflowState.upsert({
            where: { workflowDefinitionId_name: { workflowDefinitionId: workflow.id, name: 'completed' } },
            update: {},
            create: {
                workflowDefinitionId: workflow.id,
                name: 'completed',
                displayName: 'Completed',
                color: '#22c55e',
                isFinal: true,
                sortOrder: 3,
            },
        });

        // Create transitions
        await prisma.workflowTransition.upsert({
            where: { workflowDefinitionId_fromStateId_toStateId: { workflowDefinitionId: workflow.id, fromStateId: draftState.id, toStateId: activeState.id } },
            update: {},
            create: {
                workflowDefinitionId: workflow.id,
                fromStateId: draftState.id,
                toStateId: activeState.id,
                name: 'activate',
                displayName: 'Activate',
            },
        });

        await prisma.workflowTransition.upsert({
            where: { workflowDefinitionId_fromStateId_toStateId: { workflowDefinitionId: workflow.id, fromStateId: activeState.id, toStateId: completedState.id } },
            update: {},
            create: {
                workflowDefinitionId: workflow.id,
                fromStateId: activeState.id,
                toStateId: completedState.id,
                name: 'complete',
                displayName: 'Complete',
            },
        });
    }
    console.log('Created default workflows for all entity types');

    console.log('\nSeeding completed successfully!');
    console.log('\nTest credentials:');
    console.log('  Email: admin@demo.local');
    console.log('  Password: ChangeMe123!');
    console.log('  Tenant ID:', tenant.id);
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
