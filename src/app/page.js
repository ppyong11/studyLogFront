import { cookies } from 'next/headers'; 
import LandingView from "../components/mainView/LandingView";
import PlanDashBoard from "../components/mainView/PlanDashBoard";

export default async function MainPage() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_Token'); 

    if (!accessToken) {
        return <LandingView />;
    }

    return <PlanDashBoard />;
}