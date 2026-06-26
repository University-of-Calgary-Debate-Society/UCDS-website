import { useEffect, useState } from 'react';
import './../styles/constitution.css';

export default function Constitution() {
  const [activeSection, setActiveSection] = useState('preamble');

  const articles = [
    { id: 'preamble', num: '', name: 'Preamble' },
    { id: 'article-1', num: 'I', name: 'The Organization' },
    { id: 'article-2', num: 'II', name: 'Objectives' },
    { id: 'article-3', num: 'III', name: 'Membership' },
    { id: 'article-4', num: 'IV', name: 'Executive Structure' },
    { id: 'article-5', num: 'V', name: 'Officers & Duties' },
    { id: 'article-6', num: 'VI', name: 'Election Policy' },
    { id: 'article-7', num: 'VII', name: 'Meetings' },
    { id: 'article-8', num: 'VIII', name: 'Code of Conduct' },
    { id: 'article-9', num: 'IX', name: 'Equity Policy' },
    { id: 'article-10', num: 'X', name: 'Amendments' },
    { id: 'article-11', num: 'XI', name: 'Dissolution' },
  ];

  const [isInitialMount, setIsInitialMount] = useState(true);

  // Scroll to the top of the content area when switching sections
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    const element = document.querySelector('.docs-content');
    if (element) {
      const headerOffset = 112; // 7rem sticky offset
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [activeSection]);

  const currentIndex = articles.findIndex((art) => art.id === activeSection);
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  return (
    <main className="constitution-page">
      {/* Background Stamp Watermark */}
      <img src="/photos/su_registered_club.png" alt="Students' Union Registered Club Stamp" className="constitution-bg-stamp" />

      <section className="section">
        <div className="container">
          
          {/* Main Title Section */}
          <div className="constitution-header-block">
            <div className="title-text-group">
              <div className="title-with-badge">
                <h1>UCDS Constitution</h1>
                <span className="pending-review-badge">
                  <svg className="warning-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Pending Review 2026-2027
                </span>
              </div>
              <p className="subtitle">Official governing document, bylaws, and equity policies of the University of Calgary Debate Society.</p>
            </div>
            <div className="download-action">
              <a href="/documents/constitution.docx" download className="button button-download">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download DOCX
              </a>
            </div>
          </div>

          <div className="docs-layout">
            {/* Sidebar Table of Contents */}
            <aside className="docs-sidebar">
              <div className="toc-nav">
                <h3 className="toc-main-header">CONSTITUTION</h3>
                <span className="toc-title">SECTIONS</span>
                <ul>
                  {articles.map((art) => (
                    <li key={art.id}>
                      <button 
                        onClick={() => setActiveSection(art.id)}
                        className={`toc-link ${activeSection === art.id ? 'active' : ''}`}
                      >
                        {art.num ? (
                          <>
                            <span className="toc-num">{art.num}</span>
                            <span className="toc-name">{art.name}</span>
                          </>
                        ) : (
                          <span className="toc-name-only">{art.name}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main Content Area - Displaying ONLY the active section */}
            <article className="docs-content">
              {activeSection === 'preamble' && (
                <section id="preamble" className="doc-section">
                  <h2>Preamble</h2>
                  <p>It is hereby declared that The University of Calgary Debate Society exists to the following ends:</p>
                  <ul className="doc-list">
                    <li><strong>0.1</strong> To develop the skills, understanding, and confidence of all members, in order to better formulate and present thoughts, ideas, and opinions in a respectful and articulate manner;</li>
                    <li><strong>0.2</strong> To compete and represent the University of Calgary in formal and informal debating competitions ranging from local to regional, provincial, national, and international levels;</li>
                    <li><strong>0.3</strong> To foster an open-minded platform and educational environment for members to discuss amongst themselves, within the community, and with organizations of the University of Calgary.</li>
                  </ul>
                  <p className="doc-highlight">We call into force The Constitution of The University of Calgary Debate Society.</p>
                </section>
              )}

              {activeSection === 'article-1' && (
                <section id="article-1" className="doc-section">
                  <h2>Article I: The Organization</h2>
                  <ul className="doc-list">
                    <li><strong>1.1</strong> This organization shall be known as <em>The University of Calgary Debate Society</em>, hereafter abbreviated as <strong>"The UCDS"</strong>, and can otherwise be referred to as the University of Calgary Intercollegiate Debate Team.</li>
                    <li><strong>1.2</strong> This document will serve as The Constitution, Code of Conduct, and Equity Policy for UCDS.</li>
                    <li><strong>1.3</strong> The UCDS shall operate as a non-profit organization as per the University of Calgary Students’ Union (SU) Club Bylaws.
                      <ul className="doc-sublist">
                        <li><strong>1.3.1</strong> The UCDS will adhere to membership guidelines as per The SU’s Club Bylaws.</li>
                      </ul>
                    </li>
                    <li><strong>1.4</strong> The organization’s priority is to its team members and students of the University of Calgary.
                      <ul className="doc-sublist">
                        <li><strong>1.4.1</strong> The UCDS shall represent The University of Calgary as an independent member of the Canadian Universities Society for Intercollegiate Debate (abbreviated as <strong>"The CUSID"</strong>).</li>
                      </ul>
                    </li>
                    <li><strong>1.5</strong> This organization’s second duty is to its role as a chapter member of CUSID, specifically CUSID West, and to the CUSID Vice President Western.
                      <ul className="doc-sublist">
                        <li><strong>1.5.1</strong> This organization is expected to implement and adhere to The CUSID Code of Conduct, rules, procedures, and member requirements.</li>
                      </ul>
                    </li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-2' && (
                <section id="article-2" className="doc-section">
                  <h2>Article II: The Objectives</h2>
                  <ul className="doc-list">
                    <li><strong>2.1</strong> Provide individuals with a platform to exchange ideas and opinions via debate, while cultivating logical and equitable discussion.</li>
                    <li><strong>2.2</strong> Compete in intercollegiate tournaments representing the University of Calgary.
                      <ul className="doc-sublist">
                        <li><strong>2.2.1</strong> Competitions may be hosted by UCDS or CUSID members.</li>
                        <li><strong>2.2.2</strong> Competitions include title tournaments, competitive invitationals, training workshops, and public speaking contests.</li>
                      </ul>
                    </li>
                    <li><strong>2.3</strong> Act as a platform to cultivate growth through weekly practices, training workshops, and in-house tournaments.</li>
                    <li><strong>2.4</strong> Partake in community outreach with junior high and high school debate circuits in Alberta, specifically in Calgary.
                      <ul className="doc-sublist">
                        <li><strong>2.4.1</strong> Outreach may occur in collaboration with the Alberta Debate and Speech Association (<strong>"The ADSA"</strong>).</li>
                        <li><strong>2.4.2</strong> Outreach can be organized independently by UCDS.</li>
                        <li><strong>2.4.3</strong> Outreach can occur in collaboration with other organizations at the discretion of the Executive Council.</li>
                      </ul>
                    </li>
                    <li><strong>2.5</strong> Foster individual growth through collaboration with other Students' Union academic clubs and organizations.</li>
                    <li><strong>2.6</strong> UCDS and all members shall abide by the SU Clubs Manual, UCDS Constitution, Code of Conduct, Equity Policy, and all CUSID bylaws/procedures.</li>
                    <li><strong>2.7</strong> Establish, develop, and preserve an equitable, inclusive, and safe space for all members.</li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-3' && (
                <section id="article-3" className="doc-section">
                  <h2>Article III: Membership</h2>
                  <ul className="doc-list">
                    <li><strong>3.1</strong> Membership tiers consist of: <strong>General Members</strong> and <strong>Members in Good Standing</strong>.</li>
                    <li><strong>3.2</strong> All University of Calgary students are eligible to become General Members or Members in Good Standing.</li>
                    <li><strong>3.3</strong> General Membership is acquired by tendering a yearly membership fee to the VP Finance (or appointed Executive officer).
                      <ul className="doc-sublist">
                        <li><strong>3.3.1</strong> The Executive Council shall set a membership fee of no more than $20 by September 1.</li>
                        <li><strong>3.3.1.1</strong> All prospective members shall pay the same fee.</li>
                        <li><strong>3.3.1.2</strong> The fee shall remain constant for the entirety of the academic year.</li>
                        <li><strong>3.3.2</strong> The Executive Council may waive the membership fee in cases of financial hardship.</li>
                      </ul>
                    </li>
                    <li><strong>3.4</strong> General Members are entitled to:
                      <ul className="doc-sublist">
                        <li><strong>3.4.1</strong> Receive notice of and attend all UCDS events.</li>
                        <li><strong>3.4.2</strong> Compete at debate tournaments as a representative of UCDS.</li>
                        <li><strong>3.4.3</strong> Access UCDS training materials and participate in weekly practices.</li>
                      </ul>
                    </li>
                    <li><strong>3.5</strong> Members in Good Standing are entitled to:
                      <ul className="doc-sublist">
                        <li><strong>3.5.1</strong> Vote at all General Meetings.</li>
                        <li><strong>3.5.2</strong> Run for and serve as an Executive Officer on the Executive Council.</li>
                      </ul>
                    </li>
                    <li><strong>3.6</strong> General Members become Members in Good Standing by:
                      <ul className="doc-sublist">
                        <li><strong>3.6.1</strong> Accruing a minimum of 15 hours of club activity in the Fall semester, increasing to a total of 30 hours in the Winter semester.</li>
                        <li><strong>3.6.1.1</strong> A member is classified in Good Standing if they hit these targets in the current term.</li>
                        <li><strong>3.6.1.2</strong> Club Activities include all UCDS and CUSID sanctioned events.</li>
                        <li><strong>3.6.2</strong> Paying all outstanding fees.</li>
                      </ul>
                    </li>
                    <li><strong>3.7</strong> A General Member may be granted Good Standing status by a 2/3rd majority vote of either the Executive Council or at a General Meeting.</li>
                    <li><strong>3.8</strong> The membership year runs from September 1 until August 31.</li>
                    <li><strong>3.9</strong> Members may resign by written notice to the President. Paid fees are non-refundable, and outstanding fees remain due.</li>
                    <li><strong>3.10</strong> Removal of a member for conduct issues must be recommended by the U of C Student Conduct Office or the CUSID Ombudsperson. Membership is voided immediately upon receipt of such recommendation. Paid fees are non-refundable.</li>
                    <li><strong>3.11</strong> The Executive Council may request that the Student Conduct Office or CUSID Ombudsperson recommend member removal if they have:
                      <ul className="doc-sublist">
                        <li><strong>3.11.1</strong> Failed to abide by the UCDS Code of Conduct.</li>
                        <li><strong>3.11.2</strong> Violated Students' Union or University policy at any UCDS or CUSID event.</li>
                        <li><strong>3.11.3</strong> Violated CUSID professional standards at official tournaments.</li>
                        <li><strong>3.11.4</strong> Failed to comply with equity resolutions proposed by the Equity Triad.</li>
                      </ul>
                    </li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-4' && (
                <section id="article-4" className="doc-section">
                  <h2>Article IV: Executive Structure</h2>
                  <ul className="doc-list">
                    <li><strong>4.1</strong> The UCDS shall be governed by the Executive Council.</li>
                    <li><strong>4.2</strong> The Executive Council manages all club affairs and aligns operational goals with the UCDS mission.</li>
                    <li><strong>4.3</strong> The Council is responsible for:
                      <ul className="doc-sublist">
                        <li><strong>4.3.1</strong> Promoting core UCDS objectives as outlined in Article II.</li>
                        <li><strong>4.3.2</strong> Promoting membership internally and externally.</li>
                        <li><strong>4.3.3</strong> Maintaining financial accounts and records.</li>
                        <li><strong>4.3.4</strong> Designing and drafting internal policies, rules, and operational procedures.</li>
                        <li><strong>4.3.5</strong> Long-term strategic planning.</li>
                      </ul>
                    </li>
                    <li><strong>4.4</strong> The Executive Council consists of eight (8) elected Executive Officers, between one (1) and four (4) Junior Executives elected at the By-Election, and one (1) Appointed Advisor.</li>
                    <li><strong>4.5</strong> All Council members hold one vote, except the Appointed Advisor.
                      <ul className="doc-sublist">
                        <li><strong>4.5.1</strong> In the case of a tie, the President resigns their vote.</li>
                        <li><strong>4.5.2</strong> Junior Executives hold one vote each.</li>
                        <li><strong>4.5.3</strong> No individual may hold more than one vote.</li>
                      </ul>
                    </li>
                    <li><strong>4.6</strong> Any Council member may resign by providing two weeks' written notice.</li>
                    <li><strong>4.7</strong> Members may request removal of an Executive Officer. The President (or VP Internal if the President is being challenged) must immediately notify the membership. Grounds include:
                      <ul className="doc-sublist">
                        <li><strong>4.7.1</strong> Conduct issues under Articles 3.10 and 3.11.</li>
                        <li><strong>4.7.2</strong> Unresolved ongoing conflict of interest.</li>
                        <li><strong>4.7.3</strong> Missing three consecutive Council meetings without valid excuse.</li>
                        <li><strong>4.7.4</strong> Gross negligence or acting deliberately against the interests of UCDS.</li>
                      </ul>
                    </li>
                    <li><strong>4.8</strong> An Executive Officer may be removed by a 2/3rd majority vote of Members in Good Standing.
                      <ul className="doc-sublist">
                        <li><strong>4.8.1</strong> Any member may petition for removal (requiring signatures of 50% + 1 of members, up to a maximum of 10 members, including rationales).</li>
                        <li><strong>4.8.2</strong> Upon petition submission, the Council must call a General Meeting within 30 days to conduct the vote.</li>
                      </ul>
                    </li>
                    <li><strong>4.9</strong> Vacancies may be filled by appointing a Member in Good Standing, or left vacant until the next election (reassigning duties to existing Council members).</li>
                    <li><strong>4.10</strong> The Term of Office runs from May 1 to April 30.</li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-5' && (
                <section id="article-5" className="doc-section">
                  <h2>Article V: Executive Officers and Duties</h2>
                  <ul className="doc-list">
                    <li><strong>5.1</strong> The Executive Council consists of the following roles and their key duties:
                      <ul className="doc-sublist">
                        <li><strong>5.1.1 President</strong>: Serves as the official spokesperson for UCDS and the Council; represents the club at CUSID and SU meetings; schedules and chairs Council and General Meetings; sets the annual calendar; co-signs financial accounts; reviews equity issues; manages officer transitions.</li>
                        <li><strong>5.1.2 Vice President Internal</strong>: Tracks member engagement, Co-Curricular Record (CCR) hours, and portal registrations; distributes announcements and newsletters; records and publishes public Council minutes; plans monthly social events and the annual retreat.</li>
                        <li><strong>5.1.3 Vice President Outreach</strong>: Promotes UCDS to the campus and public; manages the official website and social media platforms; coordinates Expo and Club’s Week booths; designs merchandise and promotional materials; handles UCDS lockers.</li>
                        <li><strong>5.1.4 Vice President Finance</strong>: Processes banking, e-transfers, and fee collections; co-signs financial accounts with the President; creates budgets for tournaments and socials; applies for SU and external grants; maintains the financial ledger and pays insurance.</li>
                        <li><strong>5.1.5 Director(s) of Training</strong>: Develops curricula and presentations for practices; creates monthly educational Quicksheets; maintains master lists of member rankings and tournament records; writes debate style guides; trains members in tournament tabulation.</li>
                        <li><strong>5.1.6 Director of Tournaments</strong>: Coordinates all UCDS-hosted and external debate tournaments; bookings rooms; manages registration forms; arranges travel logistics, accommodation, room blocks, and vehicle assignments for traveling delegations.</li>
                        <li><strong>5.1.7 Director of Equity</strong>: Ensures a safe, inclusive, and welcoming environment; resolves disputes and code of conduct complaints; appoints two non-executive Equity Officers to the Equity Triad; drafts objective equity reports.</li>
                        <li><strong>5.1.8 Junior Executives</strong>: Assist Executive Officers in their portfolios, learn organizational operations, and participate in Council votes.</li>
                        <li><strong>5.1.9 Appointed Advisor</strong>: Non-voting advisory position appointed by the Council from previous executives in Good Standing; assists officers but is excluded from confidential equity operations.</li>
                      </ul>
                    </li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-6' && (
                <section id="article-6" className="doc-section">
                  <h2>Article VI: Election Policy</h2>
                  <ul className="doc-list">
                    <li><strong>6.1</strong> Elections are held at the By-Election (prior to Nov 30) and the AGM (prior to Apr 30).</li>
                    <li><strong>6.2</strong> The President appoints a non-candidate, non-voting Chief Returning Officer (CRO) to run the election.</li>
                    <li><strong>6.3</strong> The CRO publishes available positions two weeks prior to the election.</li>
                    <li><strong>6.4</strong> Candidacy declarations and platforms must be received by the CRO at least one week prior. Platforms must comply with the Equity Policy.</li>
                    <li><strong>6.5</strong> The CRO makes platforms available to membership one week prior. Campaigning is prohibited until platforms are published.</li>
                    <li><strong>6.6</strong> The VP Internal publishes the Voter List (Members in Good Standing) 72 hours before the election. Written appeals regarding voting eligibility must be submitted to the Council at least 24 hours prior.</li>
                    <li><strong>6.7</strong> Voting is conducted via secret ballot. The CRO cross-references voters with the Voter List, secures ballots for 48 hours, and accepts verified absentee ballots (submitted 24 hours prior due to illness, exams, or emergencies).</li>
                    <li><strong>6.8</strong> Candidates present a 2-minute speech (opposing candidates leave the room) followed by a 5-minute Q&A panel per candidate.</li>
                    <li><strong>6.9</strong> Uncontested positions require a Yes/No vote (&gt;50% approval). If a candidate fails, floor nominations are opened. If no nominations are accepted, the incoming Council appoints a replacement.</li>
                    <li><strong>6.10</strong> The candidate with the most votes wins. In a tie, a ranked run-off election is held. Remaining ties are resolved by Council decision.</li>
                    <li><strong>6.11</strong> Written election appeals must be submitted to the CRO within 48 hours. Re-elections may only be called due to verified constitutional violations.</li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-7' && (
                <section id="article-7" className="doc-section">
                  <h2>Article VII: Meetings</h2>
                  <ul className="doc-list">
                    <li><strong>7.1</strong> UCDS conducts three types of meetings: Executive Council Meetings, General Meetings, and Weekly Practices.</li>
                    <li><strong>7.2 Executive Meetings</strong>: Open to all members except during confidential <em>in camera</em> sessions; held a minimum of twice a month; require a minimum of 48 hours' notice (5 business days recommended); quorum is 50% + 1 of voting Council members.</li>
                    <li><strong>7.3 General Meetings</strong>:
                      <ul className="doc-sublist">
                        <li><strong>7.3.1</strong> UCDS holds at least two General Meetings annually (Fall Meeting by Dec 31, AGM by Apr 30). Special meetings must be convened within 30 days of receiving a petition from 50%+1 of members or 10 members.</li>
                        <li><strong>7.3.2</strong> Notice of General Meetings must be sent to all members at least 7 days prior.</li>
                        <li><strong>7.3.3</strong> General Meeting resolutions override conflicting Council decisions.</li>
                        <li><strong>7.3.4</strong> Quorum is 50% + 1 of Members in Good Standing. Proxies are prohibited.</li>
                        <li><strong>7.3.5</strong> The AGM includes officer portfolio reports, scholarship awards, constitutional amendments, and Council elections.</li>
                      </ul>
                    </li>
                    <li><strong>7.4 Weekly Practices</strong>: Scheduled at times and locations set by the Council. The Council may vote unanimously to restrict public attendance if necessary.</li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-8' && (
                <section id="article-8" className="doc-section">
                  <h2>Article VIII: Code of Conduct</h2>
                  <ul className="doc-list">
                    <li><strong>8.1</strong> Members must maintain a safe, inclusive, and encouraging environment.</li>
                    <li><strong>8.2</strong> Violations include: offensive language/behavior, denigration (race, gender, sexual orientation, disability, etc.), harassment, threats, and property damage.</li>
                    <li><strong>8.3</strong> Members must respect boundaries regarding bodily contact and romantic/sexual advances.</li>
                    <li><strong>8.4</strong> Retaliation against any member reporting a violation is strictly prohibited.</li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-9' && (
                <section id="article-9" className="doc-section">
                  <h2>Article IX: Equity Policy</h2>
                  <ul className="doc-list">
                    <li><strong>9.1</strong> Code of Conduct violations trigger the equity process led by the Equity Triad.</li>
                    <li><strong>9.2</strong> Equity matters remain strictly confidential. Prior violations may only be referenced if directly relevant to a current complaint.</li>
                    <li><strong>9.3</strong> Equity complaints must be submitted to the Equity Triad. Executives receiving complaints must forward them immediately.</li>
                    <li><strong>9.4</strong> The Director of Equity keeps the President informed (unless the President is conflicted, in which case the rest of the Council is notified).</li>
                    <li><strong>9.5</strong> The Equity Triad decides on appropriate actions, specifying timelines. Non-compliance results in temporary loss of Good Standing status.</li>
                    <li><strong>9.6</strong> For severe violations, the Triad may recommend membership suspension, subject to a 2/3rd majority vote of the Executive Council and notification to the SU Coordinator of Student Organizations.</li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-10' && (
                <section id="article-10" className="doc-section">
                  <h2>Article X: Constitutional Amendments</h2>
                  <ul className="doc-list">
                    <li><strong>10.1</strong> The Constitution is amended only by a 2/3rd majority vote of Members in Good Standing present at a General Meeting.</li>
                    <li><strong>10.2</strong> Amendments are accepted up to 7 days prior to or during the AGM.</li>
                    <li><strong>10.3</strong> Meetings called for amendments require at least 21 days' notice, with amendment details distributed 7 days prior.</li>
                    <li><strong>10.4</strong> Approved amendments take effect immediately and must be submitted to the Students' Union Clubs Office within 14 days.</li>
                    <li><strong>10.5</strong> No amendment shall violate Students' Union policy. All changes must be cataloged with dates and original texts.</li>
                  </ul>
                </section>
              )}

              {activeSection === 'article-11' && (
                <section id="article-11" className="doc-section">
                  <h2>Article XI: Dissolution</h2>
                  <ul className="doc-list">
                    <li><strong>11.1</strong> In the event of dissolution, UCDS assets will not be distributed to members.</li>
                    <li><strong>11.2</strong> All remaining funds and assets must be transferred to a similar non-profit organization.</li>
                    <li><strong>11.3</strong> The recipient organization is chosen by General Meeting resolution. If a resolution is not reached, the decision falls to the Executive Council, and then to the President.</li>
                  </ul>
                </section>
              )}

              {/* Prev / Next Pagination Control */}
              <div className="docs-pagination">
                {prevArticle ? (
                  <button 
                    onClick={() => setActiveSection(prevArticle.id)}
                    className="pagination-btn pagination-prev"
                  >
                    <span className="pagination-label">PREVIOUS SECTION</span>
                    <span className="pagination-title">← {prevArticle.name}</span>
                  </button>
                ) : <div className="pagination-empty" />}

                {nextArticle ? (
                  <button 
                    onClick={() => setActiveSection(nextArticle.id)}
                    className="pagination-btn pagination-next"
                  >
                    <span className="pagination-label">NEXT SECTION</span>
                    <span className="pagination-title">{nextArticle.name} →</span>
                  </button>
                ) : <div className="pagination-empty" />}
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
