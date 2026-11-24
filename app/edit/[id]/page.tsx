import type { Metadata  } from "next";
import ControlCenter from "@/features/control/ControlCenter";


export const metadata : Metadata = { title : "Control Center" , robots : { index : false } };

export default async function EditPage ({ params } : { params : Promise<{ id : string }>}) {
    const { id } = await params;
    return <ControlCenter id={id} />
}