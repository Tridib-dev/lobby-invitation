export type flapShapeId =  "Pointed" | "Scalloped" | "Arch" ;


const cap = (t: number , straight : number) => {
    if(t <= straight) return 1;
    const U = (t - straight) / (1 - straight) ;
    return Math.sqrt(Math.max(0,1 - U * U));
}

const SCALLOP = { lobes : 4 , depth : 0.1 , straight : 0.2};

export const FLAP_SHAPES : Record<flapShapeId , (t : number) => number> = {
    Pointed : (t) => 1 - t * 0.98,
    Arch : (t) => cap(t , 0.3),
    Scalloped : (t) => {
        const u = t <= SCALLOP.straight ? 0 : (t - SCALLOP.straight) / (1 - SCALLOP.straight);
        const phi = Math.asin(Math.min(1,u));
        const wave = Math.abs(Math.cos(2 * SCALLOP.lobes * phi));
        return cap(t, SCALLOP.straight) * (1 - SCALLOP.depth + SCALLOP.depth * wave);
    },
};