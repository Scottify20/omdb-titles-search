import { SvgStrings } from '../../SvgStrings/SvgStrings';
import { TitlePropsParsed, OmdbTitleDetailsFetch } from '../../omdb/OmdbTitleDetailsFetch';
import {
  insertHTMLInsideElementById,
  elementByIdExists,
  elementFromHTMLString,
} from '../../utils/GlobalUtils';

export class TitleDetailsRenderer {
  static [key: string]: any; // static index signature
  private static _IsOn = false;
  private static _titleData: TitlePropsParsed;

  constructor(isOn: boolean) {
    TitleDetailsRenderer._IsOn = isOn;
  }

  static async viewTitle(titleId: string) {
    if (this._IsOn) {
      this._titleData = (await OmdbTitleDetailsFetch.getTitleData(titleId)) as TitlePropsParsed;

      console.log(this._titleData);
      // console.log(this._titleData);

      this.renderTitleDetailsWindow();
      this.bindData();
      this.showParentElementsAfterDataBinding();
      this.closeButtonListener();
    }
  }

  private static bindData() {
    // binding text contents to the elements listed in the property _propPlainDataAndElementIdMap
    for (const keyArrayPair of this._propPlainDataAndElementIdMap) {
      const key = Object.keys(keyArrayPair)[0];
      const id = keyArrayPair[key][0];
      const type = keyArrayPair[key][1];
      const data = this._titleData?.[key] as string;

      this.bindTextContentOrURLToElementById(id, data, type);
    }

    // binding child element and their text contents to the parent elements listed in the property _propArrayOfStringAndParentIdMap
    for (const keyArrayPair of this._propArrayOfStringAndParentIdMap) {
      const key = Object.keys(keyArrayPair)[0];
      const parentId = keyArrayPair[key][0];
      const templateKey = keyArrayPair[key][1];
      const type = keyArrayPair[key][2];
      const data = this._titleData?.[key] as string[];
      const classOfElement = keyArrayPair[key][3];

      this.bindChildElementsToParentElement(parentId, templateKey, data, type, classOfElement);
    }

    // binding the rating scores and some styling to rating section
    // the property _propRatingDataAndElementIdMap
    if (this.propNotNull('Ratings')) {
      for (const keyArrayPair of this._propRatingDataAndElementIdMap) {
        const keySource = Object.keys(keyArrayPair)[0] as
          | 'Internet Movie Database'
          | 'Rotten Tomatoes'
          | 'Metacritic';

        const elementIdForScore = keyArrayPair[keySource][0];
        const elementIdForStyling = keyArrayPair[keySource][1];
        const ratingFound = (): { Source: string; Value: number } => {
          const ratings = this._titleData.Ratings;
          if (ratings.find((rating) => rating.Source === keySource)) {
            return ratings.find((rating) => rating.Source === keySource) as {
              Source: string;
              Value: number;
            };
          } else {
            return { Source: keySource, Value: 0 };
          }
        };
        const score = ratingFound().Value;
        this.bindRatingScoreAndStyling(keySource, score, elementIdForScore, elementIdForStyling);
      }
    }
  }
  // since the title details window and backdrop is hiddent by default (see .hidden scss class)
  private static showParentElementsAfterDataBinding() {
    const titleDetailsContainer = document.getElementById('title-details__container');
    const titleDetailsBackdrop = document.getElementById('title-details__backdrop');

    titleDetailsContainer?.classList.remove('hidden');
    titleDetailsBackdrop?.classList.remove('hidden');
  }

  private static closeButtonListener() {
    const closeButton = document.getElementById('title-details__close-btn');
    closeButton?.addEventListener('click', () => {
      this.hideDialogAndBackdrop();
    });
  }

  private static hideDialogAndBackdrop() {
    document.body.classList.remove('scroll-disabled');
    const dialogContainer = document.getElementById('title-details__container');
    const backdrop = document.getElementById('title-details__backdrop');

    dialogContainer?.remove();
    backdrop?.remove();
  }

  private static propNotNull(...propKeys: string[]): boolean {
    for (const propKey of propKeys) {
      if (this._titleData && this._titleData[propKey] && this._titleData[propKey] !== 'N/A') {
        const property = this._titleData[propKey];
        let propArrayIsNotEmpty = true;
        let propIsArray = Array.isArray(property);

        if (propIsArray) {
          const propArray = property as string[] | number[];
          if (propArray[0] && propArray[0] !== 'N/A') {
            propArrayIsNotEmpty = true;
          } else {
            propArrayIsNotEmpty = false;
          }
        }
        // ternary operator
        // return the value of propArrayIsNotEmpty (true or false) if property is and array
        // return true if property is not an array since the false conditon for non array properties is below
        return propIsArray ? propArrayIsNotEmpty : true;
      } else {
        return false;
      }
    }

    return false;
  }

  private static renderTitleDetailsWindow() {
    // disable scrolling of content under the title detais window
    document.body.classList.add('scroll-disabled');
    // insert the parent container (the parent container of the window) to the body
    document.body.insertAdjacentHTML('afterbegin', this.templateTitleDetailsContainer);
    // insert backdrop to body
    document.body.insertAdjacentHTML('afterbegin', this.templateTitleDetailsBackdrop);
    // insert the title details window to the parent container
    insertHTMLInsideElementById(this.templateTitleDetails, 'title-details__container');
    // hero section
    insertHTMLInsideElementById(this.templateHero, 'title-details');
    if (this.propNotNull('Ratings')) {
      // ratings section container
      insertHTMLInsideElementById(this.templateSectionRatings, 'title-details');
      if (this.ratingExists('Internet Movie Database')) {
        // imdb rating
        insertHTMLInsideElementById(
          this.templateSubsectionRatingImdb,
          'title-details__ratings-container'
        );
      }
      if (this.ratingExists('Rotten Tomatoes')) {
        // rotten tomateos rating fresh
        insertHTMLInsideElementById(
          this.templateSubsectionRatingRT,
          'title-details__ratings-container'
        );
      }
      if (this.ratingExists('Metacritic')) {
        // metacritic rating
        insertHTMLInsideElementById(
          this.templateSubsectionRatingMetacritic,
          'title-details__ratings-container'
        );
      }
    }

    if (this.propNotNull('totalSeasons')) {
      // seasons
      insertHTMLInsideElementById(this.templateSectionSeasons, 'title-details');
    }
    if (this.propNotNull('Actors')) {
      // cast
      insertHTMLInsideElementById(this.templateSectionCast, 'title-details');
    }
    if (this.propNotNull('Director')) {
      // directors
      insertHTMLInsideElementById(this.templateSectionDirectors, 'title-details');
    }
    if (this.propNotNull('Writer')) {
      // writers
      insertHTMLInsideElementById(this.templateSectionWriters, 'title-details');
    }
    if (this.propNotNull('Awards')) {
      // Awards
      insertHTMLInsideElementById(this.templateSectionAwards, 'title-details');
    }
    if (this.propNotNull('Language', 'Country', 'Released', 'DVD', 'BoxOffice')) {
      // at least one of the subsections in the other info section is not null or N/A
      // Other info
      insertHTMLInsideElementById(this.templateSectionOtherInfo, 'title-details');

      if (this.propNotNull('Language')) {
        // insert language on other info
        insertHTMLInsideElementById(
          this.templateSubsectionLanguage,
          'title-details-joined-section-container'
        );
      }
      if (this.propNotNull('Country')) {
        // insert country on other info
        insertHTMLInsideElementById(
          this.templateSubsectionCountry,
          'title-details-joined-section-container'
        );
      }
      if (this.propNotNull('Released')) {
        // insert release date on other info
        insertHTMLInsideElementById(
          this.templateSubsectionReleaseDate,
          'title-details-joined-section-container'
        );
      }
      if (this.propNotNull('DVD')) {
        // insert dvd release on other info
        insertHTMLInsideElementById(
          this.templateSubsectionDVD,
          'title-details-joined-section-container'
        );
      }
      if (this.propNotNull('BoxOffice')) {
        // insert box office earnings on other info
        insertHTMLInsideElementById(
          this.templateSubsectionBoxOffice,
          'title-details-joined-section-container'
        );
      }
    }
  }

  private static ratingExists(sourceName: string): boolean {
    if (this._titleData) {
      return this._titleData.Ratings.some((sourceObj) => {
        return sourceObj.Source === sourceName;
      });
    }
    return false;
  }

  private static bindRatingScoreAndStyling(
    source: 'Internet Movie Database' | 'Rotten Tomatoes' | 'Metacritic',
    score: number,
    elementIdForScore: string,
    elementIdForStyling: string
  ) {
    // binding score
    if (elementByIdExists(elementIdForScore)) {
      const elementForScore = document.getElementById(elementIdForScore) as Element;
      elementForScore.textContent = score.toString();
    }

    // binding styling or svg icon
    if (elementByIdExists(elementIdForStyling)) {
      const elementForStyling = document.getElementById(elementIdForStyling) as Element;

      if (source === 'Rotten Tomatoes') {
        const rating = () => (score > 75 ? 'certified-fresh' : score > 60 ? 'fresh' : 'rotten');

        elementForStyling.prepend(elementFromHTMLString(this.rtSvgStringSelector(rating())));
      }

      if (source === 'Metacritic') {
        const color = () => (score > 75 ? 'green' : score > 50 ? 'yellow' : 'red');
        elementForStyling.classList.add(color());
      }
    }
  }

  private static bindTextContentOrURLToElementById(
    elementId: string,
    data: string | string[],
    type: 'textContent' | 'imageUrlSrc' | 'yearArray'
  ) {
    if (elementByIdExists(elementId)) {
      const element = document.getElementById(elementId) as Element;
      if (type === 'textContent') {
        element.textContent = data as string;
      } else if (type === 'imageUrlSrc') {
        // if the element is an img
        element.setAttribute('src', data as string);
      } else if (type === 'yearArray') {
        // if the data is an array of years
        element.textContent = (data as string[]).join('-');
      }
    } else {
      // console.log(`element with id: ${elementId} does not exist`);
    }
  }

  private static bindChildElementsToParentElement(
    parentId: string,
    templateKey: string,
    data: string[],
    type: 'not' | 'dot-separated',
    classOfElementToInsertDataTo: string
  ) {
    if (elementByIdExists(parentId)) {
      for (let i = 0; i < data.length; i++) {
        const template = document.createElement('div');
        template.innerHTML = this[templateKey];
        // to add unique ids for every item (this is unnecessary for now might be useful in the future)
        // example: title-data-container--country becomes title-data--country-0
        // which will become the id of the inserted template element
        template.firstElementChild?.setAttribute(
          'id',
          `${parentId.replace('-container', '')}--${i}`
        );

        // add the data (textContent) to the child element or its subelement
        const elementToInsertDataTo = template.querySelector(`.${classOfElementToInsertDataTo}`);
        if (elementToInsertDataTo) {
          elementToInsertDataTo.textContent = data[i];
        }
        // insert template element to parent
        insertHTMLInsideElementById(template.innerHTML, parentId);

        if (type === 'dot-separated' && i < data.length - 1) {
          // Writer // Actors // Language // Country // Director
          // insert dot separator after every appended element except the last element
          insertHTMLInsideElementById(this.templateDotSeparatorTextItem, parentId);
        }
      }
    }
  }

  // key is the source of rating
  // first value in array is the id of element to put the score data into
  // second optional value in array is the id for:
  //metacritic logo where the color of the circular stroke around the logo changes based on the score
  // and for the id of the parent element of rotten tomatoes rating
  // the svg icon rt changes based on the score
  private static _propRatingDataAndElementIdMap: { [key: string]: [string, string] }[] = [
    { 'Internet Movie Database': ['title-data--imdb-score', 'N/A'] },
    { 'Rotten Tomatoes': ['title-data--rt-score', 'title-details__rating--rotten-tomatoes'] },
    { Metacritic: ['title-data--metacritic-score', 'ratings-logo--metacritic'] },
  ];

  // the key is the property key from the parsed title data
  // the first value in the array is the element's id
  // the second value means which property of the element will be replaced with the value (whether its the element's textContent,  the src attribute if the element's an img) and
  // the year is a special case since it has an array of strings but will be rendered a joined string
  private static _propPlainDataAndElementIdMap: {
    [key: string]: [`title-data--${string}`, 'textContent' | 'imageUrlSrc' | 'yearArray'];
  }[] = [
    { Title: ['title-data--title', 'textContent'] },
    { Type: ['title-data--type', 'textContent'] },
    { Year: ['title-data--year', 'yearArray'] },
    { Rated: ['title-data--rating', 'textContent'] },
    { Runtime: ['title-data--runtime', 'textContent'] },
    { Plot: ['title-data--plot', 'textContent'] },
    { Awards: ['title-data--awards', 'textContent'] },
    { BoxOffice: ['title-data--box-office', 'textContent'] },
    { Released: ['title-data--release-date', 'textContent'] },
    { DVD: ['title-data--dvd', 'textContent'] },
    { Poster: ['title-data--posterURL', 'imageUrlSrc'] },
    { Poster: ['title-data--posterURL-blurred', 'imageUrlSrc'] },
  ];

  // the key is the property key from the parsed title data
  // the first value in the array is the parent element's id
  // the second value is the key of the HTML template inside this class that will be inserted to the parent element
  // the third value indicates whether the strings inside the string[] property will be rendered as a list of text that are separated by dots
  // the fourth value is the class of the child elements where the strings in the data will be binded to
  private static _propArrayOfStringAndParentIdMap: {
    [key: string]: [
      `title-data-container--${string}`,
      `templateSubsection${string}` | `templateSubSubsection${string}`,
      'dot-separated' | 'not',
      `title-data--${string}`
    ];
  }[] = [
    {
      Genre: ['title-data-container--genre', 'templateSubsectionGenre', 'not', 'title-data--genre'],
    },
    {
      Writer: [
        'title-data-container--writer',
        'templateSubsectionWriter',
        'dot-separated',
        'title-data--writer-name',
      ],
    },
    {
      Actors: [
        'title-data-container--actor',
        'templateSubsectionActor',
        'not',
        'title-data--actor-name',
      ],
    },
    {
      Language: [
        'title-data-container--language',
        'templateSubSubsectionLanguage',
        'dot-separated',
        'title-data--language',
      ],
    },
    {
      Country: [
        'title-data-container--country',
        'templateSubSubsectionCountry',
        'dot-separated',
        'title-data--country',
      ],
    },
    {
      Director: [
        'title-data-container--director',
        'templateSubsectionDirector',
        'dot-separated',
        'title-data--director-name',
      ],
    },
  ];

  private static templateTitleDetailsContainer = /*html*/ `<div id="title-details__container" class="title-details__container hidden"></div>`;

  private static templateTitleDetails = /*html*/ `<div id="title-details" class="title-details"></div>`;

  private static templateTitleDetailsBackdrop = /*html*/ `<div id="title-details__backdrop" class="title-details__backdrop hidden"></div>`;

  private static templateHero = /*html*/ `
  <div class="title-details__hero">
    <div class="title-details__title-and-close-btn-container">
      <h2 id="title-data--title" class="title-details__title">Title</h2>
      <div id="title-details__close-btn" class="title-details__close-btn">
        <svg class="x-icon" viewBox="0 0 847 1058.8" xmlns="http://www.w3.org/2000/svg">
          <path d="M423.4,407.4l274.2-274.2c80.9-80.9,202.8,42,121.9,122.9L546.4,529.3l273.2,274.2
  c80.9,80.9-41,202.8-121.9,121.9L423.4,652.2L150.3,925.4c-80.9,80.9-203.8-41-122.9-121.9l274.2-274.2L27.3,256.1
  c-80.9-80.9,42-203.8,122.9-122.9L423.4,407.4z"/>
        </svg>
      </div>
    </div>
    <div class="title-details__metadata-container">
      <p id="title-data--type" class="title-data title-data--title-type text-dot-separated">TV Series</p>
        <p class="dot-separator metadata">•</p>
      <p id="title-data--year" class="title-data title-data--year text-dot-separated">Year</p>
        <p class="dot-separator metadata">•</p>
      <p id="title-data--rating" class="title-data title-data--rating text-dot-separated">Rating</p>
        <p class="dot-separator metadata">•</p>
      <p id="title-data--runtime" class="title-data title-data--runtime text-dot-separated">Runtime</p>
    </div>
    <div class="title-details__poster-genre-plot-container">
      <img id="title-data--posterURL" class="title-details__poster" src="https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg" onerror="this.onerror=null; this.style.display='none'; this.src='https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg'" alt="" width="200px">
      <div id="genre-plot-container" class="genre-plot-container">
        <div id="title-data-container--genre" class="genre-container">
        </div>
        <p id="title-data--plot" class="title-details__plot">Plot</p>
      </div>
    </div>
    <div class="hero-bg-blurred-container">
      <img id="title-data--posterURL-blurred" class="hero-bg-blurred" src="https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"
      
      onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg'"
      >
    </div>
  </div>`;

  private static templateSubsectionGenre = /*html*/ `
    <div class="genre title-data--genre">Genre</div>`;

  private static templateSectionRatings = /*html*/ `
    <div id="title-details__section-container" class="title-details__section-container title-details__section--ratings">
        <h3 class="title-details__section-title">Ratings</h3>
        <div id="title-details__ratings-container" class="title-details__ratings-container">
        </div>
    </div>`;

  private static templateSubsectionRatingImdb = /*html*/ `
      <div class="title-details__rating-container title-details__rating--imdb">
          ${SvgStrings.imdb}
          <p class="title-details__rating__rating imdb-score"><span id="title-data--imdb-score" class="medium">Imdb Score</span> / 10</p>
      </div>
  `;

  private static rtSvgStringSelector(rating: 'fresh' | 'certified-fresh' | 'rotten'): string {
    switch (rating) {
      case 'fresh':
        return SvgStrings.rtFresh;
      case 'certified-fresh':
        return SvgStrings.rtCertifiedFresh;
      case 'rotten':
        return SvgStrings.rtRotten;
      default:
        return SvgStrings.rtFresh;
    }
  }
  private static templateSubsectionRatingRT = /*html*/ `
        <div id="title-details__rating--rotten-tomatoes" class="title-details__rating-container title-details__rating--rotten-tomatoes">
        <!-- place for icon -->
          <p class="title-details__rating__rating rt-score"><span id="title-data--rt-score" class="medium">RT Score</span> %</p>
        </div>`;
  private static templateSubsectionRatingMetacritic = /*html*/ `
      <div class="title-details__rating-container title-details__rating--metacritic">
          ${SvgStrings.metacritic}
          <p class="title-details__rating__rating metacritic-score"><span id="title-data--metacritic-score" class="medium metacritic-score">MT Score</span></p>
      </div>`;

  private static templateSectionSeasons = /*html*/ `
            <div class="title-details__section-container title-details__section--seasons">
              <div class="seasons-title-and-more-seasons-button-container">
                <h3 class="title-details__section-title">Seasons</h3>
                <div class="more-seasons-button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 7.44">
                    <path d="M6.44,7.44a1,1,0,0,1-.71-.29L.29,1.71A1,1,0,0,1,1.71.29L6.45,5,11.3.29a1,1,0,1,1,1.4,1.42L7.14,7.16A1,1,0,0,1,6.44,7.44Z"/>
                  </svg>
                </div>
              </div>
              <p><span id="title-data--no-of-seasons">8</span><span class="season-or-seasons"> Seasons</span></p>
            </div>`;

  private static templateSectionCast = /*html*/ `
    <div class="title-details__section-container title-details__section--top-cast">
      <h3 class="title-details__section-title">Top Cast</h3>
      <div id="title-data-container--actor" class="title-details__cast-container">
      </div>
    </div>`;

  private static templateSubsectionActor = /*html*/ `
    <div class="title-details__actor-container">
      ${SvgStrings.actorPhotoPlaceholder}
      <p class="title-details__actor-name title-data--actor-name">Actor Name</p>
    </div>`;

  private static templateSectionDirectors = /*html*/ `
      <div class="title-details__section-container title-details__section--directors">
          <h3 class="title-details__section-title"><span class="director-or-directors">Director</span></h3>
          <div id="title-data-container--director" class="title-details__section--directors-container title-details__section-container--dot-separated">
          </div>
      </div>`;
  private static templateSubsectionDirector = /*html*/ `
  <p class="title_details__director text-dot-separated title-data--director-name">Director</p>`;

  private static templateSectionWriters = /*html*/ `
        <div class="title-details__section-container title-details__section--writers">
            <h3 class="title-details__section-title">Writers</h3>
            <div id="title-data-container--writer" class="title-details__section--writers-container title-details__section-container--dot-separated">
            </div>
        </div>`;

  private static templateSubsectionWriter = /*html*/ `
      <p class="title_details__writer text-dot-separated title-data--writer-name" >Writer</p>`;

  private static templateSectionAwards = /*html*/ `
      <div class="title-details__section-container title-details__section--awards">
        <h3 class="title-details__section-title">Awards</h3>
        <p id="title-data--awards" class="title-details__awards">awards list</p>
      </div>`;

  private static templateSectionOtherInfo = /*html*/ `
    <div 
    id="title-details-joined-section-container"
    class="title-details-joined-section-container title-details__section--other-info-group">
    </div>`;

  private static templateSubsectionLanguage = /*html*/ `
    <div class="title-details__section-container title-details__section--language">
        <h3 class="title-details__section-title"><span class="language-or-languages">Language</span></h3>
        <div id="title-data-container--language" class="title-details__section--language-container title-details__section-container--dot-separated">
        </div>
    </div>`;
  private static templateSubSubsectionLanguage = /*html*/ `
  <p class="title_details__language text-dot-separated title-data--language">language</p>`;

  private static templateSubsectionCountry = /*html*/ `
    <div class="title-details__section-container title-details__section--country">
      <h3 class="title-details__section-title">
      <span class="country-or-countries">Country</span> of Origin</h3>
      <div
      id="title-data-container--country"
      class="title-details__section--country title-details__section-container--dot-separated">
      </div>
    </div>`;

  private static templateSubSubsectionCountry = /*html*/ `<p class="title_details__country text-dot-separated title-data--country">country</p>`;

  private static templateSubsectionReleaseDate = /*html*/ `
    <div class="title-details__section-container title-details__release-date">
      <h3 class="title-details__section-title">Release Date</h3>
      <p id="title-data--release-date" class="title_details__release-date">release-date</p>
    </div>`;

  private static templateSubsectionDVD = /*html*/ `
    <div class="title-details__section-container title-details__dvd">
      <h3 class="title-details__section-title">DVD</h3>
      <p id="title-data--dvd" class="title_details__dvd">dvd-date</p>
    </div>`;

  private static templateSubsectionBoxOffice = /*html*/ `
      <div class="title-details__section-container title-details__box-office">
        <h3 class="title-details__section-title">Box Office</h3>
        <p id="title-data--box-office" class="title_details__box-office">$000,000,000</p>
      </div>`;

  // static templateDotSeparatorMetadata = /*html*/ `<p class="dot-separator metadata">•</p>`;
  private static templateDotSeparatorTextItem = /*html*/ `<p class="dot-separator sections">•</p>`;
}
