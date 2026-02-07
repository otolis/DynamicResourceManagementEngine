import { useState } from 'react';
import './styles/base.css';
import './styles/components.css';
import { Layout } from './components/layout/Layout';
import { SchemaRenderer } from './components/renderer/SchemaRenderer';
import type { SchemaField } from './components/renderer/SchemaRenderer';
import { BrutalistButton } from './components/common/BrutalistButton';

const DEMO_SCHEMA: SchemaField[] = [
  { name: 'projectName', displayName: 'Project Name', dataType: 'STRING', isRequired: true },
  { name: 'description', displayName: 'Description', dataType: 'TEXT' },
  { name: 'budget', displayName: 'Initial Budget', dataType: 'DECIMAL' },
  { name: 'status', displayName: 'Project Status', dataType: 'ENUM', options: [
    { value: 'DRAFT', displayName: 'Draft Mode' },
    { value: 'ACTIVE', displayName: 'Active Pipeline' },
    { value: 'COMPLETED', displayName: 'Archived / Complete' },
  ]},
  { name: 'deadline', displayName: 'Release Date', dataType: 'DATE' },
  { name: 'isPriority', displayName: 'High Priority Flag', dataType: 'BOOLEAN' },
];

function App() {
  const [formData, setFormData] = useState<Record<string, any>>({
    projectName: 'NEO-BRUTALIST ARCH',
    status: 'ACTIVE',
    isPriority: true,
  });

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log('Saving Data:', formData);
    alert('DATA CAPTURED: CHECK CONSOLE');
  };

  return (
    <Layout title="Schema Manifest // Project Initializer">
      <div className="flex flex-col gap-xl">
        <section className="flex flex-col gap-md">
          <div className="text-mono uppercase text-xs font-black opacity-50">
            [ Module / DynamicFormRenderer ]
          </div>
          <SchemaRenderer
            fields={DEMO_SCHEMA}
            values={formData}
            onChange={handleFieldChange}
          />
        </section>

        <section className="border-top pt-xl flex gap-md justify-end">
          <BrutalistButton variant="outline" onClick={() => setFormData({})}>
            Reset Manifest
          </BrutalistButton>
          <BrutalistButton variant="accent" onClick={handleSave}>
            Initialize Project
          </BrutalistButton>
        </section>
        
        <section className="mt-xl p-md border-all bg-gray-50">
          <div className="text-mono text-xs uppercase font-black border-bottom pb-xs mb-sm">
            Current State Data Object
          </div>
          <pre className="text-mono text-sm overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </section>
      </div>
    </Layout>
  );
}

export default App;
