/** @format */

import React from 'react';
import Image from 'next/image';

export default function ChurchStaff() {
	const churchStaffMembers = [
		{
			id: 0,
			name: 'Pastor Joe Oh',
			description: 'Vision Casting Pastor',
			image: '/assets/images/about/church-staff/PjoeGif.gif',
		},
		{
			id: 1,
			name: 'Margot Chae',
			description: 'Intern JDSN',
			image: '/assets/images/about/church-staff/MargotGif.gif',
		},
		{
			id: 2,
			name: 'Isak Choi',
			description: 'Creative GSN',
			image: '/assets/images/about/church-staff/IsakGif.gif',
		},
		{
			id: 3,
			name: 'Victor',
			description: 'Facilities',
			image: '/assets/images/about/church-staff/VictorGif.gif',
		},
		{
			id: 4,
			name: 'Elaina Choi',
			description: 'Service',
			image: '/assets/images/about/church-staff/ElainaGif.gif',
		},
		{
			id: 5,
			name: 'Monica Oh',
			description: 'Follow up',
			image: '/assets/images/about/church-staff/MonicaGif.gif',
		},
		{
			id: 6,
			name: 'Thomas Shin',
			description: 'Media',
			image: '/assets/images/about/church-staff/ThomasGif.gif',
		},
		{
			id: 7,
			name: 'Chance Son',
			description: 'Life Groups',
			image: '/assets/images/about/church-staff/ChanceGif.gif',
		},
		{
			id: 8,
			name: 'Sohee Kim',
			description: 'Videography',
			image: '/assets/images/about/church-staff/SoheeGif.gif',
		},
		{
			id: 9,
			name: 'Helen Kang',
			description: 'Publication',
			image: '/assets/images/about/church-staff/HelenGif.gif',
		},
		{
			id: 10,
			name: 'Jake Im',
			description: 'Missions',
			image: '/assets/images/about/church-staff/JakeGif.gif',
		},
		{
			id: 11,
			name: 'Stella Jung',
			description: 'Administration',
			image: '/assets/images/about/church-staff/StellaGif.gif',
		},
		{
			id: 12,
			name: 'Eugene Hong',
			description: 'Worship',
			image: '/assets/images/about/church-staff/EugeneGif.gif',
		},
		{
			id: 13,
			name: 'Jaedong Na',
			description: 'Worship',
			image: '/assets/images/about/church-staff/JaedongGif.gif',
		},
		{
			id: 14,
			name: 'Lara Thompson',
			description: 'Outreach',
			image: '/assets/images/about/church-staff/LaraGif.gif',
		},
		{
			id: 15,
			name: 'Emily Jystad',
			description: 'Welcoming',
			image: '/assets/images/about/church-staff/EmilyGif.gif',
		},
		{
			id: 16,
			name: 'Ellie Moon',
			description: 'Hospitality',
			image: '/assets/images/about/church-staff/EllieGif.gif',
		},
		{
			id: 17,
			name: 'Enzo Choi',
			description: 'Creative',
			image: '/assets/images/about/church-staff/EnzoGif.gif',
		},
		{
			id: 18,
			name: 'Kathy Kim',
			description: 'Creative',
			image: '/assets/images/about/church-staff/KathyGif.gif',
		},
		{
			id: 19,
			name: 'Carmen',
			description: "Kid's Ministry",
			image: '/assets/images/about/church-staff/CarmenGif.gif',
		},
	];
	return (
		<section className="text-center mt-[104px] mb-[97px] gap-16 flex flex-col items-center">
			<div className="text-3xl sm:text-4xl font-bold">CHURCH STAFF</div>
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
				{churchStaffMembers.map((member) => (
					<div key={member.id} className="flex flex-col items-center gap-2">
						<Image
							className="rounded-md"
							src={member.image}
							alt={member.name}
							width={275}
							height={275}
						/>

						<div className="text-lg font-bold">{member.name}</div>
						<div className="text-lg text-[#8F8F8F] font-bold">
							{member.description}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
