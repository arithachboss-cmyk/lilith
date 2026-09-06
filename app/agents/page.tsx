import { requireChatGPTUser } from '../chatgpt-auth';
import AgentDesk from './workspace';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Lilith | Agent M1' };
export default async function Page() {
    await requireChatGPTUser('/agents');
    return <AgentDesk />;
}
