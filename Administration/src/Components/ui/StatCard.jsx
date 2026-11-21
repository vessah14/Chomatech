export default function StatCard({Icone,badge,Montant,device,Raison,className1}){
    return(
        <>
        <div className={`px-5 py-5 rounded-2xl flex flex-col gap-6 ${className1}`}>
            <div className="flex justify-between items-center ">
                <span className="text-2xl">{Icone}</span>
                {badge && <span className="text-sm bg-gray-50/30 px-2 rounded-full ">{badge}</span>}
            </div>
            <div className="flex flex-col space-y-2">
                <span className="text-2xl font-extrabold">{Montant}</span>
                <span className="text-base text-gray-300">{device}</span>
                <span className="text-lg font-bold">{Raison}</span>
            </div>
        </div>
        </>
    )
}