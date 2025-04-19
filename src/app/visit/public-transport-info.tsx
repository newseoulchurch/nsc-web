/** @format */

import React from 'react';

export default function PublicTransportInfo() {
	const publicTransportation = [
		{
			name: 'Seocho Station',
			description:
				'You can get on [Bus 5413] in front of Exit 3 of Seocho Station and get off at Seongdu Ma-eul, Education Training Center',
		},
		{
			name: 'Bangbae Station',
			description:
				'Get on the [Seocho 13 Bus] in front of Exit 2 of Bangbae Station, get off at Dongdeok Girls’ High School and walk for 3 minutes.',
		},
		{
			name: 'Sadang Station',
			description:
				'Take [Seocho 17 Bus] in front of Exit 1 of Sadang Station and go 1 stop. Get off at Dongdeok Girl’s High School and walk for 5 minutes.',
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<div className="text-left text-2xl font-bold uppercase">
				Public Transportation
			</div>

			<div className="text-left flex flex-col gap-4 text-base sm:text-lg w-full max-w-[905px]">
				{publicTransportation.map((station, i) => (
					<div
						key={i}
						className="flex flex-col sm:flex-row items-start gap-2 sm:gap-0"
					>
						<div className="font-semibold uppercase sm:w-[250px] text-nowrap">
							{station.name}
						</div>
						<div className="w-full">{station.description}</div>
					</div>
				))}
			</div>
		</div>
	);
}
