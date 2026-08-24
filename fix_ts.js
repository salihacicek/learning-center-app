const fs = require('fs');

let content = fs.readFileSync('../blogsite-ui/src/app/features/architecture-schema/architecture-schema.component.ts', 'utf8');

// Replace component selector and class name
content = content.replace('app-architecture-schema', 'app-microservice-tutorial');
content = content.replace('ArchitectureSchemaComponent', 'MicroserviceTutorialComponent');

// Replace imports
content = content.replace(/import \{ NODE_DETAILS, NodeDetail \} from '\.\/node-details\.data';\n/g, "");
content = content.replace(/import \{ AUTH_LAYERS, AUTH_FLOWS \} from '\.\/data\/auth-architecture\.data';\n/g, "");
content = content.replace(/import \{ FOLLOWER_LAYERS, FOLLOWER_FLOWS \} from '\.\/data\/follower-architecture\.data';\n/g, "");
content = content.replace(/import \{ ADVANCED_LAYERS, ADVANCED_FLOWS \} from '\.\/data\/advanced-architecture\.data';\n/g, "import { TUTORIAL_LAYERS, TUTORIAL_FLOWS } from './data/tutorial.data';\n");

// Replace NodeDetail mentions (just make it any for simplicity or keep a small inline interface)
content = content.replace(/selectedNode = signal<NodeDetail \| null>\(null\);/g, 'selectedNode = signal<any | null>(null);');
content = content.replace(/const detail = NODE_DETAILS\[nodeId\];/g, 'const detail = null;');

// Replace tabs logic
content = content.replace(/activeTab = signal<.*>\('auth'\);/g, "activeTab = signal<'tutorial'>('tutorial');");
content = content.replace(/layers = computed\(\(\) => \{[^}]+\}\);/g, "layers = computed(() => TUTORIAL_LAYERS);");
content = content.replace(/flows = computed\(\(\) => \{[^}]+\}\);/g, "flows = computed(() => TUTORIAL_FLOWS);");

// Replace targetFlowId logic inside onBoxClick
const box_click_logic = `
    let targetFlowId: string | null = null;
    if (node.id === 'client-node') {
        targetFlowId = 'login-flow';
    } else if (node.id === 'crud-service' || node.id === 'crud-db') {
        targetFlowId = 'crud-flow';
    } else {
        targetFlowId = 'login-flow';
    }
`;
content = content.replace(/let targetFlowId: string \| null = null;[\s\S]*?if \(targetFlowId\)/, box_click_logic + "if (targetFlowId)");

fs.writeFileSync('src/app/features/microservice-tutorial/microservice-tutorial.component.ts', content);
