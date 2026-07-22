import unittest
from bs4 import BeautifulSoup

from scraper import extract_latest_harti_pdf_info


class TestHartiListingParser(unittest.TestCase):
    def test_extracts_pdf_from_table_layout(self):
        html = '''
        <html><body>
          <table>
            <tr><th>Date</th><th>Type</th><th>Link</th></tr>
            <tr>
              <td>2026-07-22</td><td>English</td>
              <td><a href="/uploads/pricereport_2026-07-22.pdf">Download</a></td>
            </tr>
          </table>
        </body></html>
        '''
        soup = BeautifulSoup(html, 'html.parser')

        link, date = extract_latest_harti_pdf_info(soup)

        self.assertEqual(link, '/uploads/pricereport_2026-07-22.pdf')
        self.assertEqual(date, '2026-07-22')

    def test_falls_back_to_any_pdf_link_without_table(self):
        html = '''
        <html><body>
          <ul>
            <li>Latest report <a href="files/daily_2026-07-21.pdf?download=1">PDF</a></li>
          </ul>
        </body></html>
        '''
        soup = BeautifulSoup(html, 'html.parser')

        link, date = extract_latest_harti_pdf_info(soup)

        self.assertEqual(link, 'files/daily_2026-07-21.pdf?download=1')
        self.assertEqual(date, '2026-07-21')


if __name__ == '__main__':
    unittest.main()
