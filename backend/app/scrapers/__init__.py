"""
Job scrapers.

One module per source (RemoteOK, JSearch / Google Jobs, WeWorkRemotely, ...).
Each scraper subclasses `BaseScraper` and yields `RawJob`s. The pipeline
normalises and persists them.
"""
