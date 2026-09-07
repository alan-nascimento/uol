# Research notes and fact sheet - Phase 1

Background research for *The Internet in Brazil, 1995-2026*. This file records
not just what was found but what was **rejected and why**, because the
difference between a fact and a widely repeated claim is the substance of the
research stage.

Scope is fixed by the brief: the internet in one country during the author's
lifetime. Born 1995, so the window is 1995 to 2026. That boundary is enforced
in code as well as editorially - `js/validate.js` rejects any record with a
year outside it, so an out-of-scope event cannot reach the page by accident.

## Method

Sources were sought in this order of preference, and a claim was only used when
a source that actually stated it could be retrieved:

1. Primary legal texts: Planalto (`planalto.gov.br`) for laws and decrees,
   CGI.br and Anatel for portarias and norms
2. The institution responsible: Banco Central for Pix, IBGE for household
   statistics, CETIC.br / NIC.br for survey data, Anatel for spectrum, STF for
   court decisions
3. Contemporaneous reputable press, used only where no primary source could be
   retrieved, and identified as such below

## Key finding: Portaria 147 and Portaria 148 are different instruments

Secondary writing about 1995 frequently blurs these two, and an early draft of
this project's own planning did the same. Both were issued on **31 May 1995**
and they did different things:

- **Portaria Interministerial nº 147** was signed jointly by the Ministers of
  Communications and of Science and Technology, and created the *Comitê Gestor
  Internet do Brasil*. Note the original name: the modern form *Comitê Gestor
  da Internet no Brasil* dates from the 2003 decree. Members were appointed
  separately by Portaria Interministerial nº 183 of 3 July 1995.
  <https://cgi.br/portarias/numero/147/>

- **Portaria nº 148** was issued by the Ministry of Communications alone and
  approved **Norma 004/95**, which defined the *Serviço de Conexão à Internet*
  as a *Serviço de Valor Adicionado* rather than a telecommunications service,
  and obliged the state carriers to supply network capacity to any connection
  provider without exclusivity. This is the instrument that made commercial
  ISPs possible.
  <https://informacoes.anatel.gov.br/legislacao/normas-do-mc/78-portaria-148>

A sentence about *governance* must cite 147. A sentence about *opening the
market* must cite 148. Attributing both to a single number is wrong either way,
which is why the timeline carries them as two separate 1995 entries.

## Currency: the Marco Civil's most famous clause no longer stands

A history site describing law in the present tense can go out of date and
become simply wrong. That has already happened to the single most
internationally cited part of this story.

Article 19 of the Marco Civil made platforms civilly liable for a user's
content only once they had ignored a specific court order. On **26 June 2025**
the Supremo Tribunal Federal held it **partly unconstitutional** by 8 votes to
3, and on **17 June 2026** settled the definitive thesis on the resulting
appeals. Until Congress legislates, a platform can be liable if it fails to act
on an out-of-court notification in cases of crimes and of accounts reported as
fake, and platforms must publish annual transparency reports.

Any sentence on the site describing Article 19 must therefore be written in the
past tense, or must carry the 2025 ruling alongside it. Both the timeline entry
and the Made in Brazil feature do this.
<https://noticias.stf.jus.br/postsnoticias/stf-define-parametros-para-responsabilizacao-de-plataformas-por-conteudos-de-terceiros/>

## Claims deliberately excluded

Each of the following is widely repeated and may well be true, but no source
stating it could be retrieved at the required standard, so none of it appears
on the website.

| Claim | Why it was excluded |
| --- | --- |
| Orkut launched on a specific day in January 2004 | Sources disagree: the English Wikipedia infobox says 24 January, the body of the same article says 22 January, and two contemporaneous reports (Search Engine Watch and ZDNet, both 22 January 2004) describe the launch as having just happened, with ZDNet saying "on Thursday", which was the 22nd. The evidence favours 22 January, but the site says only "January 2004". |
| Brazilians were 54% of Orkut's worldwide users in 2008 | Attributed to Ibope/NetRatings and reproduced verbatim across Brazilian outlets from an original Folha Online piece, but neither the Ibope report nor a Folha page carrying the figure could be retrieved. Comscore data is used instead, because Comscore publishes it directly. |
| Orkut peaked at 30 million Brazilian users | Reputable press citing Ibope, not a primary source. |
| Orkut became Brazilian because it was invite-only and invitations cascaded through Brazilian friendship networks | **Folklore.** This is the explanation everyone repeats and no source supports. No primary or academic source for the mechanism could be found. The site states the verified outcome (Brazil as the largest market) and Google's own stated reason for moving the product to Belo Horizonte, and offers no explanation of the cause. |
| Demi Getschko made Brazil's first internet connection in 1991 | Widely repeated, not verified against a primary source. Any caption naming him must describe him as a founding figure and CGI.br member rather than asserting the 1991 connection. |
| LGPD entry into force, the date sanctions became enforceable, creation of the ANPD | These depend on later instruments including Lei nº 13.853/2019. The timeline entry states only what the Planalto text of Lei 13.709 itself establishes. |
| Norma 004/95 to be replaced from 2027 | Found via a law firm and referenced in a CGI.br note about Consulta Pública nº 41/2022, but the Anatel act itself could not be located. Out of scope for the site regardless. |

**Reinstated on better evidence.** "Facebook overtook Orkut in Brazil" was
initially excluded as press-only. Comscore figures were then located, giving
December 2011 with 36.1 million visitors against Orkut's 34.4 million, so the
claim now appears on the site sourced to Comscore. Note that the widely
repeated year for the crossover is 2012; the Comscore data puts it in December
2011.

## Where sources disagreed

**iG's launch.** Much secondary writing places the free-ISP wave in March 2000.
The contemporaneous record says January: Folha de S.Paulo reported on 19
January 2000 that iG had started on the 9th, and a Tele Centro Sul shareholder
announcement of 17 February 2000 independently gives 9 January 2000. March 2000
is when the Cade forum on free access took place, which is the likely source of
the confusion. **The site uses 9 January 2000.**

**NETmundial attendance.** Figures range from 930 to 1,480 participants across
the organisers, a University of Pennsylvania publication, an SSRN case study
and contemporary press. **No attendance figure is given on the site.**

**Telebrás proceeds.** BNDES rounds to R$ 22 billion and a 63% premium; Anatel
and Folha give R$ 22.058 billion and 63.7%. Same figure at different
precisions, not a genuine conflict. **The precise figure is used.**

**5G premium.** The Ministry of Communications and Anatel state different
premium figures. **The premium is not quoted**; the site gives the R$ 47.2
billion total economic value, the 211.7% average premium and the R$ 4.8 billion
that reached the Treasury, all stated directly by Anatel.

**3G auction total.** Folha, Teletime and Teleco independently give
R$ 5.338 billion at an 86.67% premium. An Anatel primary page for the result
could not be retrieved, so the entry cites the contemporaneous Folha report of
21 December 2007 and asserts only what that report states. This is one of two
timeline entries not resting on a primary source.

## Entries not resting on a primary source

Flagged here so the report can be honest about it:

1. **2007, 3G auction** - Folha de S.Paulo, corroborated by Teletime and Teleco
2. **2012, 4G auction** - G1, corroborated by TI Inside and Valor Econômico. An
   Anatel page carrying the June 2012 result could not be retrieved; the
   Relatório de Gestão for 2012 would be the place to look if a primary
   citation is needed.

Both concern auction totals, which are well documented in the trade press and
consistent across outlets. Neither is load-bearing for the site's argument.

## Statistics: why the chart is not a single smooth line

The access statistics were the hardest part of this research, because the
obvious presentation is the misleading one.

**There is no household internet figure for Brazil before 2005.** TIC
Domicílios began that year. The chart therefore starts in 2005 even though the
site's period starts in 1995, and the gap is stated rather than interpolated.
Filling 1995 to 2004 with a plausible curve would be fabrication.

**The CETIC.br series has three internal methodology regimes.** 2005 to 2007
surveyed urban areas only. 2008 to 2013 was national but counted only access by
desktop or laptop, explicitly excluding mobile phones. 2014 onwards has no
device restriction. The rise from 43% in 2013 to 50% in 2014 therefore mixes
real growth with a change of definition. Every point in `data/access.json`
carries its regime, and the validator refuses a point that does not.

**The series is not monotonic, and that is not an error.** Published values run
83% (2020), 82% (2021), 80% (2022), then 84% (2023) and 83% (2024). The 2020
figure came from telephone interviews adopted during the pandemic, which
CETIC.br itself flags as requiring caution in comparison; the later wobbles sit
inside the margin of error and CETIC.br describes the period as stable.
**These values have not been smoothed.** Smoothing them would invent data.

**Two official bodies disagree by nine to seventeen points.**

| Year | CETIC.br | IBGE PNAD Contínua | Gap |
| --- | --- | --- | --- |
| 2016 | 54% | 70.8% | 16.8 points |
| 2022 | 80% | 91.6% | 11.6 points |
| 2024 | 83% | 93.7% | 10.7 points |
| 2025 | 86% | 95.0% | 9.0 points |

The verifiable cause is in the wording of the indicators. CETIC.br measures
*domicílios com acesso à Internet*, whether the household has access. IBGE
measures *existência de utilização da Internet no domicílio*, whether the
internet was used there, which counts a resident using their own phone indoors.
In a country where 65% of users reach the network only by phone, that accounts
for much of the gap. **How much each factor contributes - definition, sample,
weighting - was not verified and must not be asserted.** The 2022 Census gives
a third figure again, 86.35%, sitting between the two.

The site shows the disagreement rather than choosing a winner, because with
three public bodies giving three answers, presenting one as *the* number would
be the least honest option available.

**Beware the PNAD computer series.** IBGE's "households with a computer
connected to the internet" falls after 2013, from 42.4% to 40.5% in 2015. Brazil
did not disconnect; the indicator requires a PC and the country moved to the
phone. Shown on a chart without that label it would be seriously misleading.

**No count of lan houses exists.** This is the most-cited number in the topic
and it does not have the provenance people assume. CGI.br's TIC Lan Houses 2010
survey, which everyone cites, interviewed **412 establishments** and published a
profile of the trade, not a census. The familiar "more than 100,000" figure
comes, even in NIC.br's own coverage, from a **federal government estimate**
rather than from that survey. Industry estimates found: ABCID 108,000 in 2010
with only about 15,000 formally registered; ABCID 100,000 to 110,000 in April
2011; Sebrae 130,000 in 2010 falling to 100,000 in 2011. The site therefore
gives a range, labels it as an industry estimate, and states that no official
count exists.

**No ITU cross-check.** The ITU DataHub API returned Forbidden and the World
Bank API timed out. No ITU figure is used. This costs nothing: ITU household
data for Brazil is fed by CETIC.br and IBGE, so the cross-check would have been
circular anyway.

**Cite the extraction date.** IBGE revised its PNAD Contínua figures in July
2026: 2024 moved from 93.6% to 93.7%, and urban 2016 from 76.6% to 76.5%. The
site uses the values in SIDRA as at **7 September 2026**.

## Citation link check

Every `sourceUrl` in `data/timeline.json` was requested automatically on
7 September 2026. Eighteen of twenty returned HTTP 200.

Two returned 401 to a scripted request:

- `gov.br/anatel/.../20-anos-de-privatizacao-das-telecomunicacoes`
- `gov.br/anatel/.../anatel-homologa-resultado-do-leilao-do-5g`

`gov.br` rejects requests that do not come from a browser, so these are almost
certainly reachable normally. **Open both manually in a browser before
submission and confirm.** If either is genuinely dead, replace it rather than
leaving a broken citation.

## Outstanding

- Confirm the two `gov.br` links open in a browser
- Access statistics and the four eras of access: separate research task
- Orkut, Marco Civil and Pix deep dives, plus freely licensed media: separate
  research task
