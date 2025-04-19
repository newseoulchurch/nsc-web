/** @format */

'use client';

import { Button } from '@/components/ui/button';
import React from 'react';

export default function SermonSeriesPage() {
	const previousSermons = [
		{
			title: 'Who is Jesus?',
			description: 'A series of sermons on who Jesus is',
			url: 'https://www.youtube.com/playlist?list=PLGeHDPBuWQro0yNfRPr9Hds0nd0DJelSh',
			background: '/assets/images/sermon/crimson-bg.jpg',
		},
		{
			title: 'Emotions',
			description: 'A series of sermons on emotions',
			url: 'https://www.youtube.com/playlist?list=PLGeHDPBuWQrpehPXs_suOCITn4ged6FdB',
			background: '/assets/images/sermon/red-bg.jpg',
		},
		{
			title: 'Presence',
			description: 'A series of sermons on presence',
			url: 'https://www.youtube.com/playlist?list=PLGeHDPBuWQroZnmksjBq7YotMRiDLsggw',
			background: '/assets/images/sermon/pink-bg.jpg',
		},
	];
	return (
		<div className="bg-black text-white flex flex-col">
			<section className="flex flex-col items-center justify-center my-10 gap-4">
				<h1 className="text-4xl font-bold uppercase">Sermon Series</h1>
				<div className="text-center text-base max-w-2xl">
					Our Sermon Series offers a collection of thought-provoking teachings
					designed to deepen your faith and understanding in gospel.
				</div>
				<Button
					className="bg-black uppercase text-white border-white hover:bg-white hover:text-black"
					onClick={() => {
						window.open(
							'https://www.youtube.com/@newseoulchurch/playlists',
							'_blank'
						);
					}}
					variant="outline"
				>
					Watch on YouTube
				</Button>
			</section>

			<section className="flex flex-col items-center justify-center my-10">
				<h1 className="text-2xl font-bold uppercase">Previous Sermons</h1>
				<div className="w-full bg-[#FF03031C] h-10" />
				<div className="flex flex-col gap-8 w-full">
					{previousSermons.map((sermon) => (
						<div
							key={sermon.title}
							className="flex w-full flex-col gap-4 items-center justify-center px-14"
						>
							<div
								className="w-full bg-cover bg-center h-48 rounded-lg"
								style={{
									backgroundImage: `url(${sermon.background})`,
								}}
							>
								<div className="w-full h-full flex flex-row items-start justify-between px-14 py-4">
									<div className="flex flex-col gap-0">
										<h2 className="text-xl font-bold uppercase">
											{sermon.title}
										</h2>
										<p className="text-sm">{sermon.description}</p>
									</div>
									<div
										onClick={() => {
											window.open(sermon.url, '_blank');
										}}
										className="font-circular uppercase text-base cursor-pointer"
									>
										Watch on YouTube +
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
				<div className="w-full bg-[#FF03031C] h-10" />

				<Button
					className="bg-black uppercase text-white border-white hover:bg-white hover:text-black"
					onClick={() => {
						window.open(
							'https://www.youtube.com/@newseoulchurch/playlists',
							'_blank'
						);
					}}
					variant="outline"
				>
					More
				</Button>
			</section>
		</div>
	);
}
