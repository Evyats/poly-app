import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ErrorNotice } from "../../components/ErrorNotice";
import { LoadingView } from "../../components/LoadingView";
import { PageHeader } from "../../components/PageHeader";
import { VocabGameBoard } from "./VocabGameBoard";
import { VocabGroupSidebar } from "./VocabGroupSidebar";
import { VocabPackForm } from "./VocabPackForm";
import { VocabPackTable } from "./VocabPackTable";
import { useVocabTrainer } from "./useVocabTrainer";

export function VocabTrainerView() {
  const trainer = useVocabTrainer();

  if (trainer.loading) {
    return <LoadingView label="Loading vocabulary trainer..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Language"
        title="Vocabulary trainer"
        description="Store bilingual packs and practice them in matching rounds."
        meta={`${trainer.groups.length} groups • ${trainer.packs.length} packs`}
      />

      <Tabs defaultValue="manage">
        <TabsList>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="game">Game</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <VocabGroupSidebar
              groups={trainer.groups}
              selectedGroupId={trainer.selectedGroupId}
              newGroupName={trainer.newGroupName}
              setNewGroupName={trainer.setNewGroupName}
              onSelectGroup={trainer.setSelectedGroupId}
              onCreateGroup={trainer.createGroup}
            />

            <div className="space-y-6">
              <VocabPackForm
                selectedGroupId={trainer.selectedGroupId}
                selectedGroupName={trainer.selectedGroupName}
                setSelectedGroupName={trainer.setSelectedGroupName}
                newEnglishWords={trainer.newEnglishWords}
                newHebrewWords={trainer.newHebrewWords}
                onRenameGroup={() => void trainer.renameGroup()}
                onDeleteGroup={() => void trainer.deleteGroup(trainer.selectedGroupId!)}
                onAddPack={trainer.addPack}
                onUpdateWordField={trainer.updateWordField}
                onAddWordField={trainer.addWordField}
                onRemoveWordField={trainer.removeWordField}
              />
              {trainer.error ? <ErrorNotice message={trainer.error} /> : null}
              <VocabPackTable packs={trainer.packs} onRemovePack={(packId) => void trainer.removePack(packId)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="game">
          <VocabGameBoard
            packsCount={trainer.packs.length}
            selectedGroupName={trainer.selectedGroupName}
            gameRounds={trainer.gameRounds}
            activeRound={trainer.activeRound}
            solvedPackIds={trainer.solvedPackIds}
            selected={trainer.selected}
            progressText={trainer.progressText}
            gameMessage={trainer.gameMessage}
            gameFinished={trainer.gameFinished}
            onStartGame={trainer.startGame}
            onStopGame={trainer.stopGame}
            onPick={trainer.onPick}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
