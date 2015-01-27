Bobcat is a web scraper that is designed to scrape the pages of National Gallery of Art [NGA]. The search pages of NGA are asynchronous, therefore tools like scrapy cannot be used effectively. Bobcat uses casperjs to get page contents, parse then and extract relevant information from the pages. Bobcat can easily be modified to scrape any web site. The prerequistes can install by executing the following shell script:
	sudo ./install.sh
	
Happy forking!
