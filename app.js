const charsContainer = document.querySelector('.chars-container');
const searchInput = document.querySelector('#search');
const filterSpecies = document.querySelector('#species');
const filterGender = document.querySelector('#gender');
const filterStatus = document.querySelector('#status');
const filterLocation = document.querySelector('#location');
const nextPageButton = document.querySelector('#next-page');
const previousPageButton = document.querySelector('#previous-page');

const API = 'https://rickandmortyapi.com/api';

let allFilteredCharacters = [];
let currentPage = 1;

const defaultFilters = {
	name: '',
	species: '',
	gender: '',
	status: '',
	location: '',
	page: 1,
};

async function getCharacters({ name, species, gender, status, location, page = 1 }) {
	const queryParams = new URLSearchParams();

	if (name) queryParams.append('name', name);
	if (species) queryParams.append('species', species);
	if (gender) queryParams.append('gender', gender);
	if (status) queryParams.append('status', status);
	if (location) {
		const response = await fetch(`${API}/location?name=${location}`);
		const locationData = await response.json();
		if (locationData.results.length > 0) {
			queryParams.append('location', locationData.results[0].url);
		}
	}
	queryParams.append('page', page);

	const response = await fetch(`${API}/character?${queryParams}`);
	const characters = await response.json();

	return characters.results;
}

async function render({ characters }) {
	const filteredCharacters = characters.filter((character) => {
		const { species, gender, status, location } = defaultFilters;

		if (
			(!species || character.species === species) &&
			(!gender || character.gender === gender) &&
			(!status || character.status === status) &&
			(!location || character.location.name === location)
		) {
			return true;
		}

		return false;
	});

	filteredCharacters.forEach((character) => {
		const card = document.createElement('div');
		card.className = 'char';
		card.innerHTML = `
     <img src="${character.image}" alt="${character.name}">
     <div class="char-info">
     <h3>${character.name}</h3>
     <h6>${character.species} - ${character.status}</h6>
     <h6>${character.location.name}</h6>
     </div>`;

		card.addEventListener('click', () => {
			displayCharacterDetails(character);
		});

		charsContainer.appendChild(card);
	});
}

async function displayCharacterDetails(character) {
	const modal = document.createElement('div');
	modal.className = 'character-modal';

	const lastSeen = await getLastSeen(character);

	const episodesList = character.episode
		.map((episode) => {
			return `<p>${episode}</p>`;
		})
		.join('');

	modal.innerHTML = `
<div class="modal-content">
     <span class="close-button" onclick="closeModal()">&times;</span>
     <img src="${character.image}" alt="${character.name}"><br>
     <h2>${character.name}</h2>
     <p><b>Species:</b> ${character.species}</p>
     <p><b>Status:</b> ${character.status}</p>
     <p><b>Location:</b> ${character.location.name}</p>
	<p><b>Last Seen:</b> ${lastSeen}</p>
     
     <div class="episodes-list"><h3>Episodes:</h3><br>${episodesList}</div>
</div>
`;

	document.body.appendChild(modal);
	document.body.style.overflow = 'hidden';
}

function closeModal() {
	const modal = document.querySelector('.character-modal');
	if (modal) {
		modal.remove();
		document.body.style.overflow = 'auto';
	}
}

async function getLastSeen(character) {
	try {
		const lastEpisodeUrl = character.episode[character.episode.length - 1];
		const response = await fetch(lastEpisodeUrl);
		const lastEpisodeData = await response.json();

		const lastSeen = lastEpisodeData.air_date;

		return lastSeen;
	} catch (error) {
		console.error('Erro ao buscar a última vez vista:', error);
		return 'N/A';
	}
}

async function getLocations() {
	const response = await fetch(`${API}/location`);
	const locationsData = await response.json();

	return locationsData.results.map((location) => location.name);
}
const customLocations = [];
async function populateLocationOptions() {
	const locationSelect = document.querySelector('#location');
	const locationOptions = await getLocations();

	const combinedLocations = [...new Set([...locationOptions, ...customLocations])];

	combinedLocations.forEach((locationName) => {
		const option = document.createElement('option');
		option.value = locationName;
		option.textContent = locationName;
		locationSelect.appendChild(option);
	});
}

function handleFilterChange(type, e) {
	return async () => {
		defaultFilters[type] = e.target.value;
		charsContainer.innerHTML = '';
		const characters = await getCharacters(defaultFilters);
		render({ characters });
	};
}

function addListeners() {
	filterSpecies.addEventListener('change', async (e) => {
		handleFilterChange('species', e)();
	});

	filterGender.addEventListener('change', async (e) => {
		handleFilterChange('gender', e)();
	});

	filterStatus.addEventListener('change', async (e) => {
		handleFilterChange('status', e)();
	});
	filterLocation.addEventListener('change', async (e) => {
		handleFilterChange('location', e)();
	});
}
searchInput.addEventListener('keyup', async (e) => {
	handleFilterChange('name', e)();
});

async function main() {
	await populateLocationOptions();
	const characters = await getCharacters(defaultFilters);
	addListeners();
	render({ characters });
}

async function previousPage() {
	if (defaultFilters.page > 1) {
		defaultFilters.page -= 1;
		charsContainer.innerHTML = '';
		const characters = await getCharacters(defaultFilters);
		render({ characters });
	}
}

async function nextPage() {
	defaultFilters.page += 1;
	charsContainer.innerHTML = '';
	const characters = await getCharacters(defaultFilters);
	render({ characters });
}


main();
